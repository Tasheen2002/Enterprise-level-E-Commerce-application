import { describe, expect, it } from "vitest";
import {
  DomainError,
  DomainValidationError,
  EmptyFieldError,
  InvalidFormatError,
} from "../src/domain/domain-error";
import { UuidId } from "../src/domain/value-objects/uuid-id.base";
import { UserId } from "../../../modules/user-management/domain/value-objects/user-id.vo";
import { VariantId } from "../../../modules/product-catalog/domain/value-objects/variant-id.vo";
import { ReservationId as CartReservationId } from "../../../modules/cart/domain/value-objects/reservation-id.vo";
import { ReservationId as PickupReservationId } from "../../../modules/inventory-management/domain/value-objects/reservation-id.vo";

class ErrorFixture extends DomainError {}
class ValidationFixture extends DomainValidationError {}
const id = "d3b07384-d113-4956-a5d2-069d30560a6a";

describe("core domain error contract", () => {
  it("retains Error identity, subclass name, message and stack", () => {
    const error = new ErrorFixture("Synthetic rule rejected", "RULE_REJECTED", 409);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe("ErrorFixture");
    expect(error.message).toBe("Synthetic rule rejected");
    expect(error.stack).toContain("ErrorFixture: Synthetic rule rejected");
  });
  it.each([
    [undefined, undefined, "DOMAIN_ERROR", 400],
    [404, undefined, "DOMAIN_ERROR", 404],
    ["RULE_REJECTED", undefined, "RULE_REJECTED", 400],
    ["RULE_REJECTED", 422, "RULE_REJECTED", 422],
  ] as const)(
    "preserves numeric and coded constructor compatibility: %s",
    (codeOrStatus, status, code, expectedStatus) => {
      const error = new ErrorFixture("Synthetic failure", codeOrStatus, status);
      expect(error.toJSON()).toEqual({
        name: "ErrorFixture",
        code,
        message: "Synthetic failure",
        statusCode: expectedStatus,
      });
      expect(JSON.parse(JSON.stringify(error))).toEqual(error.toJSON());
      expect(error.toJSON()).not.toHaveProperty("stack");
    },
  );
  it("retains optional validation fields and the validation subtype chain", () => {
    const error = new ValidationFixture("Required", "REQUIRED", "quantity");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainValidationError);
    expect(error).toMatchObject({
      name: "ValidationFixture",
      statusCode: 400,
      code: "REQUIRED",
      field: "quantity",
    });
    expect(new ValidationFixture("Required", "REQUIRED").field).toBeUndefined();
  });
  it("provides field-specific empty and format errors", () => {
    expect(new EmptyFieldError("email")).toMatchObject({
      field: "email",
      code: "EMPTY_FIELD",
      statusCode: 400,
      message: "email cannot be empty",
    });
    expect(new InvalidFormatError("email")).toMatchObject({
      field: "email",
      code: "INVALID_FORMAT",
      message: "email has an invalid format",
    });
    expect(new InvalidFormatError("email", "email address").message).toBe(
      "email must be a valid email address",
    );
  });
});

describe("UUID-backed semantic identifier contract", () => {
  it.each([1, 2, 3, 4, 5])("accepts the currently supported UUID version %s", (version) => {
    const value = `d3b07384-d113-${version}956-a5d2-069d30560a6a`;
    expect(UuidId.isValid(value)).toBe(true);
    expect(UserId.fromString(value).getValue()).toBe(value);
  });
  it.each([
    "",
    "not-a-uuid",
    ` ${id}`,
    `${id} `,
    id.replace("a5d2", "75d2"),
    id.replace("4956", "0956"),
    id.replace("4956", "6956"),
    "00000000-0000-0000-0000-000000000000",
    undefined,
    null,
    12,
  ])("rejects malformed/unsupported identifiers: %s", (value) => {
    expect(UuidId.isValid(value as string)).toBe(false);
    expect(() => UserId.fromString(value as string)).toThrow();
  });
  it("returns a stable client-validation code on construction failure", () => {
    try {
      UserId.fromString("synthetic-invalid-id");
      expect.fail("Invalid ID was accepted");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        name: "InvalidUuidError",
        statusCode: 400,
        code: "INVALID_UUID_FORMAT",
      });
    }
  });
  it("normalizes casing, serializes as a string and compares values within one type", () => {
    const value = UserId.fromString(id.toUpperCase());
    expect(value.getValue()).toBe(id);
    expect(value.toString()).toBe(id);
    expect(JSON.stringify(value)).toBe(JSON.stringify(id));
    expect(value.getTypeName()).toBe("UserId");
    expect(value.equals(UserId.fromString(id))).toBe(true);
    expect(value.equals(UserId.fromString(id.replace("d3b07384", "d3b07385")))).toBe(false);
    expect(value.equals(null)).toBe(false);
    expect(value.equals(undefined)).toBe(false);
  });
  it("separates identifiers with distinct labels", () => {
    expect(UserId.fromString(id).equals(VariantId.fromString(id))).toBe(false);
  });
  it("separates cart and pickup reservation identifiers even when labels and UUID bytes match", () => {
    const cart = CartReservationId.fromString(id);
    const pickup = PickupReservationId.fromString(id);
    expect(cart.getTypeName()).toBe(pickup.getTypeName());
    expect(cart.equals(pickup)).toBe(false);
    expect(pickup.equals(cart)).toBe(false);
    expect(cart.equals(CartReservationId.fromString(id))).toBe(true);
    expect(pickup.equals(PickupReservationId.fromString(id))).toBe(true);
  });
  it("generates distinct valid identifiers through actual factories", () => {
    const first = UserId.create();
    const second = UserId.create();
    expect(UuidId.isValid(first.getValue())).toBe(true);
    expect(first.equals(second)).toBe(false);
  });
});
