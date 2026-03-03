import { DomainValidationError } from "../errors";
export class LoyaltyTier {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainValidationError("Loyalty tier cannot be empty");
    }
  }

  static create(value: string): LoyaltyTier {
    return new LoyaltyTier(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: LoyaltyTier): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Common tier helpers
  static bronze(): LoyaltyTier {
    return new LoyaltyTier("bronze");
  }

  static silver(): LoyaltyTier {
    return new LoyaltyTier("silver");
  }

  static gold(): LoyaltyTier {
    return new LoyaltyTier("gold");
  }

  static platinum(): LoyaltyTier {
    return new LoyaltyTier("platinum");
  }

  isBronze(): boolean {
    return this.value.toLowerCase() === "bronze";
  }

  isSilver(): boolean {
    return this.value.toLowerCase() === "silver";
  }

  isGold(): boolean {
    return this.value.toLowerCase() === "gold";
  }

  isPlatinum(): boolean {
    return this.value.toLowerCase() === "platinum";
  }
}
