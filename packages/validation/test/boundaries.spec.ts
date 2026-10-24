import { describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import * as user from "../src/user";
import { paginatedResponseShape } from "../src/common";
import { schemaCases } from "./schema-cases";
import { toJsonSchema, validateBody } from "../../../apps/api/src/shared/http/validation";
import { LoyaltyAccountRepositoryImpl } from "../../../modules/loyalty/infra/persistence/repositories/loyalty-account.repository.impl";

describe("profile/address/payment field boundaries", () => {
  const stringBounds = [
    ...Object.entries({
      firstName: 100,
      lastName: 100,
      phone: 20,
      title: 50,
      residentOf: 100,
      nationality: 100,
    }).map(([field, max]) => ({
      name: "profile",
      schema: user.updateProfileRequestSchema,
      base: {},
      field,
      max,
    })),
    ...Object.entries({
      firstName: 100,
      lastName: 100,
      company: 100,
      addressLine1: 255,
      addressLine2: 255,
      city: 100,
      state: 100,
      postalCode: 20,
      phone: 20,
    }).map(([field, max]) => ({
      name: "address",
      schema: user.updateAddressRequestSchema,
      base: {},
      field,
      max,
    })),
    ...Object.entries({ brand: 50, providerRef: 100 }).map(([field, max]) => ({
      name: "payment",
      schema: user.addPaymentMethodRequestSchema,
      base: { type: "card" },
      field,
      max,
    })),
  ];
  it.each(stringBounds)("checks $name field $field length", ({ schema, base, field, max }) => {
    expect(schema.safeParse({ ...base, [field]: "x".repeat(max) }).success).toBe(true);
    expect(schema.safeParse({ ...base, [field]: "x".repeat(max + 1) }).success).toBe(false);
  });
  it.each(["2024-02-29", "2000-01-01T12:00:00Z", "2000-01-01T12:00:00+05:30"])(
    "accepts date/offset form %s",
    (dateOfBirth) => {
      expect(user.updateProfileRequestSchema.parse({ dateOfBirth })).toEqual({ dateOfBirth });
    },
  );
  it.each(["2023-02-29", "2024-13-01", "yesterday", "2000-01-01T12:00:00"])(
    "rejects malformed/nonexistent date %s",
    (dateOfBirth) => {
      expect(user.updateProfileRequestSchema.safeParse({ dateOfBirth }).success).toBe(false);
    },
  );
  it("checks profile structured fields, nullable avatar and format boundaries", () => {
    const id = "d3b07384-d113-4956-a5d2-069d30560a6a";
    const valid = {
      locale: "en-US",
      currency: "USD",
      defaultAddressId: id,
      defaultPaymentMethodId: id,
      avatarUrl: null,
      prefs: { enabled: true },
      stylePreferences: { colors: ["red"] },
      preferredSizes: { shirt: "M" },
    };
    expect(user.updateProfileRequestSchema.parse(valid)).toEqual(valid);
    expect(
      user.updateProfileRequestSchema.parse({ avatarUrl: "https://example.com/avatar.png" })
        .avatarUrl,
    ).toBe("https://example.com/avatar.png");
    for (const invalid of [
      { locale: "en" },
      { currency: "usd" },
      { defaultAddressId: "bad" },
      { defaultPaymentMethodId: "bad" },
      { avatarUrl: "bad" },
      { prefs: [] },
      { preferredSizes: { shirt: 12 } },
    ])
      expect(user.updateProfileRequestSchema.safeParse(invalid).success).toBe(false);
  });
  it.each(["billing", "shipping"])("accepts wire address type %s", (type) => {
    expect(
      user.addAddressRequestSchema.parse({
        type,
        addressLine1: "Main St",
        city: "Colombo",
        country: "LK",
      }).type,
    ).toBe(type);
    expect(user.updateAddressRequestSchema.parse({ type })).toEqual({ type });
  });
  it.each(["card", "wallet", "bank", "cod", "gift_card"])(
    "accepts wire payment type %s",
    (type) => {
      expect(user.addPaymentMethodRequestSchema.parse({ type }).type).toBe(type);
    },
  );
  it("checks country length, booleans, card suffix, expiry ranges and UUID references", () => {
    const address = { type: "billing", addressLine1: "Main St", city: "Colombo", country: "LK" };
    expect(user.addAddressRequestSchema.safeParse({ ...address, isDefault: true }).success).toBe(
      true,
    );
    expect(user.addAddressRequestSchema.safeParse({ ...address, country: "LKA" }).success).toBe(
      false,
    );
    expect(user.addAddressRequestSchema.safeParse({ ...address, isDefault: "true" }).success).toBe(
      false,
    );
    const card = { type: "card", last4: "1234", expMonth: 1, expYear: 2000, isDefault: true };
    expect(user.addPaymentMethodRequestSchema.parse(card)).toEqual(card);
    expect(user.updatePaymentMethodRequestSchema.parse({ expMonth: 12, expYear: 2100 })).toEqual({
      expMonth: 12,
      expYear: 2100,
    });
    for (const invalid of [
      { last4: "123" },
      { last4: "12ab" },
      { expMonth: 0 },
      { expMonth: 13 },
      { expMonth: "1" },
      { expYear: 1999 },
      { expYear: 2101 },
      { billingAddressId: "bad" },
      { isDefault: "true" },
    ])
      expect(user.addPaymentMethodRequestSchema.safeParse({ ...card, ...invalid }).success).toBe(
        false,
      );
  });
});

describe("actual transport/repository compatibility", () => {
  const changedCases = schemaCases.filter((entry) =>
    ["change-email", "delete-account", "add-address", "add-payment"].includes(entry.name),
  );
  it.each(changedCases)(
    "agrees across shared pre-validation and backend JSON schema for $name",
    async ({ name, shared, backend, valid }) => {
      const app = Fastify();
      const handler = vi.fn(async (request: { body: unknown }) => request.body);
      app.post(
        "/input",
        { preValidation: validateBody(shared), schema: { body: toJsonSchema(backend) } },
        handler,
      );
      try {
        const accepted = await app.inject({ method: "POST", url: "/input", payload: valid });
        expect(accepted.statusCode).toBe(200);
        expect(accepted.json()).toEqual(valid);
        const invalid = name.startsWith("add-")
          ? { ...valid, type: String(valid.type).toUpperCase() }
          : { ...valid, password: "x".repeat(129) };
        const rejected = await app.inject({ method: "POST", url: "/input", payload: invalid });
        expect(rejected.statusCode).toBe(400);
        expect(rejected.json().code).toBe("VALIDATION_ERROR");
        expect(handler).toHaveBeenCalledTimes(1);
      } finally {
        await app.close();
      }
    },
  );
  it("accepts an actual empty unbounded repository response with limit zero", async () => {
    const prisma = {
      loyaltyAccount: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaClient;
    const page = await new LoyaltyAccountRepositoryImpl(prisma).findWithFilters({});
    expect(page).toEqual({ items: [], total: 0, limit: 0, offset: 0, hasMore: false });
    expect(paginatedResponseShape(z.unknown()).parse(page)).toEqual(page);
  });
});
