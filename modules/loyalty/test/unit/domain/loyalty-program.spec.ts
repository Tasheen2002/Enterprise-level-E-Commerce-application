import { describe, it, expect } from "vitest";
import {
  LoyaltyProgram,
  LoyaltyProgramCreatedEvent,
  LoyaltyProgramUpdatedEvent,
  EarnRule,
  BurnRule,
  LoyaltyTierConfig,
} from "@modules/loyalty/domain/entities/loyalty-program.entity";
import { LoyaltyProgramNameRequiredError } from "@modules/loyalty/domain/errors";

describe("LoyaltyProgram Aggregate Root", () => {
  const earnRules: EarnRule[] = [
    { type: "per_dollar", points: 2, minPurchase: 10 },
    { type: "per_order", points: 50, minPurchase: 50 },
  ];

  const burnRules: BurnRule[] = [
    { type: "discount", pointsRequired: 100, value: 5 },
  ];

  const tiers: LoyaltyTierConfig[] = [
    { name: "Silver", minPoints: 1000, benefits: ["Free Shipping"] },
    { name: "Gold", minPoints: 5000, benefits: ["Free Shipping", "Priority Support"] },
  ];

  it("should successfully create a new loyalty program", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });

    expect(program.id).toBeDefined();
    expect(program.name).toBe("Standard Program");
    expect(program.earnRules).toEqual(earnRules);
    expect(program.burnRules).toEqual(burnRules);
    expect(program.tiers).toEqual(tiers);

    const events = program.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(LoyaltyProgramCreatedEvent);
    expect((events[0] as LoyaltyProgramCreatedEvent).name).toBe("Standard Program");
    expect((events[0] as LoyaltyProgramCreatedEvent).programId).toBe(program.id.getValue());
  });

  it("should throw LoyaltyProgramNameRequiredError if name is empty or whitespaces", () => {
    expect(() =>
      LoyaltyProgram.create({
        name: "",
        earnRules,
        burnRules,
        tiers,
      })
    ).toThrow(LoyaltyProgramNameRequiredError);

    expect(() =>
      LoyaltyProgram.create({
        name: "   ",
        earnRules,
        burnRules,
        tiers,
      })
    ).toThrow(LoyaltyProgramNameRequiredError);
  });

  it("should successfully update properties and emit LoyaltyProgramUpdatedEvent", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });
    program.clearDomainEvents();

    const newEarnRules: EarnRule[] = [{ type: "per_dollar", points: 3 }];
    program.update({
      name: "Premium Program",
      earnRules: newEarnRules,
    });

    expect(program.name).toBe("Premium Program");
    expect(program.earnRules).toEqual(newEarnRules);

    const events = program.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(LoyaltyProgramUpdatedEvent);
    expect((events[0] as LoyaltyProgramUpdatedEvent).programId).toBe(program.id.getValue());
  });

  it("should throw LoyaltyProgramNameRequiredError when updating to an empty name", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });

    expect(() => program.update({ name: "" })).toThrow(LoyaltyProgramNameRequiredError);
  });

  it("should correctly calculate points for purchases based on earn rules", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });

    // Purchase below minPurchase of 10:
    // per_dollar (minPurchase: 10) -> 0 points
    // per_order (minPurchase: 50) -> 0 points
    expect(program.calculatePointsForPurchase(5)).toBe(0);

    // Purchase of 25:
    // per_dollar: 25 * 2 = 50 points
    // per_order: 0 points (since 25 < 50)
    expect(program.calculatePointsForPurchase(25)).toBe(50);

    // Purchase of 60:
    // per_dollar: 60 * 2 = 120 points
    // per_order: 50 points (since 60 >= 50)
    // Total = 170
    expect(program.calculatePointsForPurchase(60)).toBe(170);
  });

  it("should return the correct tier config for points", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });

    expect(program.getTierConfigForPoints(500)).toBeNull();

    const silverConfig = program.getTierConfigForPoints(1200);
    expect(silverConfig).not.toBeNull();
    expect(silverConfig?.name).toBe("Silver");

    const goldConfig = program.getTierConfigForPoints(6000);
    expect(goldConfig).not.toBeNull();
    expect(goldConfig?.name).toBe("Gold");
  });

  it("should convert correctly to DTO", () => {
    const program = LoyaltyProgram.create({
      name: "Standard Program",
      earnRules,
      burnRules,
      tiers,
    });

    const dto = LoyaltyProgram.toDTO(program);
    expect(dto.id).toBe(program.id.getValue());
    expect(dto.name).toBe("Standard Program");
    expect(dto.earnRules).toEqual(earnRules);
    expect(dto.burnRules).toEqual(burnRules);
    expect(dto.tiers).toEqual(tiers);
    expect(dto.createdAt).toBeDefined();
    expect(dto.updatedAt).toBeDefined();
  });
});
