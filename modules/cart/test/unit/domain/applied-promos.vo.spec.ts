import { describe, it, expect } from "vitest";
import { AppliedPromos, AppliedPromoData } from "@modules/cart/domain/value-objects/applied-promos.vo";
import { DomainValidationError } from "@modules/cart/domain/errors/cart.errors";

describe("AppliedPromos Value Object", () => {
  const dummyPercentagePromo: AppliedPromoData = {
    id: "promo-1",
    code: "PERCENT10",
    type: "percentage",
    value: 10,
    appliedAt: new Date("2026-06-24T00:00:00Z"),
  };

  const dummyFixedPromo: AppliedPromoData = {
    id: "promo-2",
    code: "FIXED5",
    type: "fixed_amount",
    value: 5,
    appliedAt: new Date("2026-06-24T00:00:00Z"),
  };

  const dummyFreeShippingPromo: AppliedPromoData = {
    id: "promo-3",
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    appliedAt: new Date("2026-06-24T00:00:00Z"),
  };

  it("should create empty promos collection", () => {
    const promos = AppliedPromos.empty();
    expect(promos.isEmpty()).toBe(true);
    expect(promos.count()).toBe(0);
    expect(promos.getValue()).toEqual([]);
  });

  it("should create promos collection with unique promos", () => {
    const promos = AppliedPromos.create([dummyPercentagePromo, dummyFixedPromo]);
    expect(promos.isEmpty()).toBe(false);
    expect(promos.count()).toBe(2);
    expect(promos.hasPromo("promo-1")).toBe(true);
    expect(promos.hasPromo("promo-3")).toBe(false);
    expect(promos.getPromoCodes()).toEqual(["PERCENT10", "FIXED5"]);
  });

  it("should silently de-duplicate promos by ID upon creation, keeping the first seen", () => {
    const duplicatePromo = { ...dummyPercentagePromo, code: "PERCENT10_DUP" };
    const promos = AppliedPromos.create([dummyPercentagePromo, duplicatePromo]);
    expect(promos.count()).toBe(1);
    expect(promos.getValue()[0].code).toBe("PERCENT10");
  });

  it("should throw validation errors on invalid promo schema", () => {
    // Missing ID
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, id: "" }])).toThrow(DomainValidationError);
    // Missing Code
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, code: "" }])).toThrow(DomainValidationError);
    // Invalid type
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, type: "invalid" as any }])).toThrow(DomainValidationError);
    // Negative value
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, value: -10 }])).toThrow(DomainValidationError);
    // Percentage value > 100
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, value: 110 }])).toThrow(DomainValidationError);
    // Invalid Date
    expect(() => AppliedPromos.create([{ ...dummyPercentagePromo, appliedAt: "not-a-date" as any }])).toThrow(DomainValidationError);
  });

  it("should support serialization to and from JSON string", () => {
    const original = AppliedPromos.create([dummyPercentagePromo]);
    const json = original.toString();

    const reconstructed = AppliedPromos.fromJSON(json);
    expect(reconstructed.equals(original)).toBe(true);
    expect(reconstructed.getValue()[0].code).toBe("PERCENT10");
  });

  it("should throw on malformed JSON parsing", () => {
    expect(() => AppliedPromos.fromJSON("{invalid-json}")).toThrow(DomainValidationError);
    expect(() => AppliedPromos.fromJSON("[]")).not.toThrow();
    expect(() => AppliedPromos.fromJSON("123")).toThrow("JSON must represent an array of promos");
  });

  it("should calculate correct percentage and fixed discounts", () => {
    const promos = AppliedPromos.create([dummyPercentagePromo, dummyFixedPromo, dummyFreeShippingPromo]);
    expect(promos.getTotalPercentageDiscount()).toBe(10);
    expect(promos.getTotalFixedDiscount()).toBe(5);
    expect(promos.hasFreeShipping()).toBe(true);
  });

  it("should support adding a new promo", () => {
    const p1 = AppliedPromos.create([dummyPercentagePromo]);
    const p2 = p1.addPromo(dummyFixedPromo);

    expect(p1.count()).toBe(1);
    expect(p2.count()).toBe(2);
    expect(p2.hasPromo("promo-2")).toBe(true);
  });

  it("should throw when adding an already applied promo", () => {
    const p1 = AppliedPromos.create([dummyPercentagePromo]);
    expect(() => p1.addPromo(dummyPercentagePromo)).toThrow(DomainValidationError);
  });

  it("should support removing an applied promo", () => {
    const p1 = AppliedPromos.create([dummyPercentagePromo, dummyFixedPromo]);
    const p2 = p1.removePromo("promo-1");

    expect(p2.count()).toBe(1);
    expect(p2.hasPromo("promo-1")).toBe(false);
  });

  it("should throw when removing a promo that is not applied", () => {
    const p1 = AppliedPromos.create([dummyPercentagePromo]);
    expect(() => p1.removePromo("promo-non-existent")).toThrow(DomainValidationError);
  });

  it("should support clearing all promos", () => {
    const p1 = AppliedPromos.create([dummyPercentagePromo, dummyFixedPromo]);
    const p2 = p1.clear();
    expect(p2.isEmpty()).toBe(true);
  });
});
