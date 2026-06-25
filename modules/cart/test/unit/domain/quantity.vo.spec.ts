import { describe, it, expect } from "vitest";
import { Quantity } from "@modules/cart/domain/value-objects/quantity.vo";
import { DomainValidationError } from "@modules/cart/domain/errors/cart.errors";

describe("Quantity Value Object", () => {
  it("should create a valid quantity", () => {
    const qty = Quantity.fromNumber(5);
    expect(qty.getValue()).toBe(5);
    expect(qty.toString()).toBe("5");
  });

  it("should throw validation error if quantity is not an integer", () => {
    expect(() => Quantity.fromNumber(2.5)).toThrow(DomainValidationError);
    expect(() => Quantity.fromNumber(2.5)).toThrow("Quantity must be a whole number");
  });

  it("should throw validation error if quantity is less than minimum", () => {
    expect(() => Quantity.fromNumber(0)).toThrow(DomainValidationError);
    expect(() => Quantity.fromNumber(-1)).toThrow("Quantity must be at least 1");
  });

  it("should throw validation error if quantity exceeds maximum", () => {
    expect(() => Quantity.fromNumber(100000)).toThrow(DomainValidationError);
    expect(() => Quantity.fromNumber(100000)).toThrow("Quantity cannot exceed 999");
  });

  it("should support equality comparison", () => {
    const qty1 = Quantity.fromNumber(5);
    const qty2 = Quantity.fromNumber(5);
    const qty3 = Quantity.fromNumber(10);

    expect(qty1.equals(qty2)).toBe(true);
    expect(qty1.equals(qty3)).toBe(false);
  });

  it("should support arithmetic operations", () => {
    const qty1 = Quantity.fromNumber(5);
    const qty2 = Quantity.fromNumber(3);

    const sum = qty1.add(qty2);
    expect(sum.getValue()).toBe(8);

    const diff = qty1.subtract(qty2);
    expect(diff.getValue()).toBe(2);

    const product = qty1.multiply(2);
    expect(product.getValue()).toBe(10);
  });

  it("should throw validation error when multiplying by negative or non-integer value", () => {
    const qty = Quantity.fromNumber(5);
    expect(() => qty.multiply(-1)).toThrow(DomainValidationError);
    expect(() => qty.multiply(1.5)).toThrow("Multiplier must be a non-negative integer");
  });

  it("should support relational comparisons", () => {
    const qty1 = Quantity.fromNumber(5);
    const qty2 = Quantity.fromNumber(3);
    const qty3 = Quantity.fromNumber(5);

    expect(qty1.isGreaterThan(qty2)).toBe(true);
    expect(qty2.isLessThan(qty1)).toBe(true);
    expect(qty1.isGreaterThanOrEqual(qty3)).toBe(true);
    expect(qty1.isLessThanOrEqual(qty3)).toBe(true);
  });

  it("should provide factory methods for min and max bounds", () => {
    const minQty = Quantity.min();
    const maxQty = Quantity.max();

    expect(minQty.getValue()).toBe(1);
    expect(maxQty.getValue()).toBe(999);
  });
});
