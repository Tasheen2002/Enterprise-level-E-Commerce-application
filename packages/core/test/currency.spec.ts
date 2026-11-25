import { describe, expect, it, vi } from "vitest";
import { Currency } from "../src/domain/value-objects/currency.vo";
import * as catalog from "../src/domain/value-objects/currency.constants";
import * as legacy from "../../../modules/user-management/domain/constants/currency.constants";
import { DomainError } from "../src/domain/domain-error";
import { UserProfile } from "../../../modules/user-management/domain/entities/user-profile.entity";
import { Money } from "../../../modules/product-catalog/domain/value-objects/money.vo";

function expectCurrencyError(operation: () => unknown) {
  try {
    operation();
    expect.fail("Invalid currency accepted");
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: "INVALID_CURRENCY", statusCode: 400 });
  }
}

describe("shared currency catalog contract", () => {
  it("provides complete unique fiat metadata and keeps crypto separate", () => {
    expect(catalog.SUPPORTED_CURRENCIES).toHaveLength(31);
    expect(new Set(catalog.SUPPORTED_CURRENCIES).size).toBe(31);
    const codes = [...catalog.SUPPORTED_CURRENCIES].sort();
    for (const metadata of [
      catalog.CURRENCY_NAMES,
      catalog.CURRENCY_SYMBOLS,
      catalog.CURRENCY_REGIONS,
    ])
      expect(Object.keys(metadata).sort()).toEqual(codes);
    expect(catalog.CRYPTO_CURRENCIES).toEqual(["BTC", "ETH", "LTC"]);
    expect(catalog.CRYPTO_CURRENCIES.every((code) => !Currency.isValidCurrencyCode(code))).toBe(
      true,
    );
  });
  it("reuses the canonical catalog through the legacy user-management export", () => {
    for (const key of [
      "SUPPORTED_CURRENCIES",
      "CRYPTO_CURRENCIES",
      "CURRENCY_NAMES",
      "CURRENCY_SYMBOLS",
      "CURRENCY_REGIONS",
      "DEFAULT_CURRENCY",
    ] as const) {
      expect(legacy[key]).toEqual(catalog[key]);
      expect(legacy[key]).toBe(catalog[key]);
    }
  });
  it.each([
    ["supported", catalog.SUPPORTED_CURRENCIES, "0", "ZZZ"],
    ["crypto", catalog.CRYPTO_CURRENCIES, "0", "ZZZ"],
    ["names", catalog.CURRENCY_NAMES, "USD", "tampered"],
    ["symbols", catalog.CURRENCY_SYMBOLS, "USD", "tampered"],
    ["regions", catalog.CURRENCY_REGIONS, "USD", "tampered"],
  ] as const)("prevents runtime mutation of %s", (_name, target, key, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)!;
    try {
      expect(Reflect.set(target, key, value)).toBe(false);
      expect(Object.isFrozen(target)).toBe(true);
      expect(Currency.isValidCurrencyCode("ZZZ")).toBe(false);
    } finally {
      // Restore the pre-fix mutable catalog even when its regression assertion fails.
      if (!Object.isFrozen(target)) Object.defineProperty(target, key, descriptor);
    }
  });
});

describe("currency value object", () => {
  it.each(catalog.SUPPORTED_CURRENCIES)("accepts and describes configured %s", (code) => {
    const currency = Currency.create(code);
    expect(currency.getValue()).toBe(code);
    expect(currency.toString()).toBe(code);
    expect(currency.equals(Currency.fromString(code))).toBe(true);
    expect(currency.isBaseCurrency()).toBe(code === "USD");
    expect(currency.getDisplayName()).toBeTruthy();
    expect(currency.getSymbol()).toBeTruthy();
    expect(currency.getMajorCurrencyRegion()).toBeTruthy();
  });
  it("retains default and stable display metadata", () => {
    expect(Currency.getDefaultCurrency().getValue()).toBe("USD");
    expect(Currency.getAllSupportedCurrencies()).toEqual(catalog.SUPPORTED_CURRENCIES);
    expect(Object.isFrozen(Currency.getAllSupportedCurrencies())).toBe(true);
    expect(Currency.create("EUR").getSymbol()).toBe("€");
    expect(Currency.create("LKR").getDisplayName()).toBe("Sri Lankan Rupee");
    expect(Currency.create("LKR").getMajorCurrencyRegion()).toBe("Asia");
    expect(Currency.create("USD").equals(Currency.create("EUR"))).toBe(false);
  });
  it.each(["usd", " uSd ", "\teur\n"])(
    "normalizes create input %s while retaining strict hydration",
    (input) => {
      expect(Currency.create(input).getValue()).toBe(input.trim().toUpperCase());
      expect(Currency.isValidCurrencyCode(input)).toBe(true);
      expectCurrencyError(() => Currency.fromString(input));
    },
  );
  it.each(["", " ", "ZZZ", "EURO", "US", "US$", "BTC", "ETH", "LTC"])(
    "rejects unsupported/empty input %s",
    (input) => {
      expectCurrencyError(() => Currency.create(input));
      expectCurrencyError(() => Currency.fromString(input));
      expect(Currency.isValidCurrencyCode(input)).toBe(false);
    },
  );
  it.each([
    { label: "undefined", input: undefined },
    { label: "null", input: null },
    { label: "number", input: 123 },
    { label: "object", input: {} },
    { label: "array", input: [] },
  ])("uses the domain error contract for non-string input $label", ({ input }) => {
    expectCurrencyError(() => Currency.create(input as unknown as string));
    expectCurrencyError(() => Currency.fromString(input as unknown as string));
    expect(Currency.isValidCurrencyCode(input as unknown as string)).toBe(false);
  });
  it("rejects objects without invoking their string conversion", () => {
    const conversion = vi.fn(() => {
      throw new Error("Synthetic coercion failure");
    });
    expectCurrencyError(() => Currency.fromString({ toString: conversion } as unknown as string));
    expect(conversion).not.toHaveBeenCalled();
  });
  it("describes the application allowlist rather than promising every currency code", () => {
    expect(() => Currency.create("ZZZ")).toThrow("Unsupported currency code: ZZZ");
    expect(() => Currency.create("")).toThrow("Currency is required");
  });
});

describe("actual shared currency consumers", () => {
  const userId = "d3b07384-d113-4956-a5d2-069d30560a6a";
  it("preserves profile default, explicit preference and strict update rejection", () => {
    const profile = UserProfile.create({ userId });
    expect(UserProfile.toDTO(profile).currency).toBe("USD");
    profile.setCurrency("LKR");
    expect(UserProfile.toDTO(profile).currency).toBe("LKR");
    expectCurrencyError(() => profile.setCurrency("eur"));
    expect(UserProfile.toDTO(profile).currency).toBe("LKR");
    expect(UserProfile.toDTO(UserProfile.create({ userId, currency: "EUR" })).currency).toBe("EUR");
  });
  it("keeps catalog money creation normalized and persistence hydration strict", () => {
    expect(Money.create(12.34, " eur ").toDTO()).toEqual({ amount: 12.34, currency: "EUR" });
    expect(Money.fromPersistence(12.34, "EUR").getCurrency().getValue()).toBe("EUR");
    expectCurrencyError(() => Money.fromPersistence(12.34, "eur"));
  });
});
