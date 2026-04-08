import { VALID_PROMO_TYPES, PROMO_MAX_PERCENTAGE } from "../constants";
import { DomainValidationError } from "../errors/cart.errors";

export interface PromoData {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping" | "buy_x_get_y";
  value: number;
  description?: string;
  appliedAt: Date;
}

export class AppliedPromos {
  private readonly value: PromoData[];

  constructor(promos: PromoData[] = []) {
    // Validate each promo
    promos.forEach((promo, index) => {
      this.validatePromo(promo, index);
    });

    // Remove duplicates based on promo ID
    const uniquePromos = this.removeDuplicates(promos);

    this.value = [...uniquePromos];
  }

  private validatePromo(promo: PromoData, index: number): void {
    if (!promo.id) {
      throw new DomainValidationError(
        `Promo at index ${index} must have an ID`,
      );
    }

    if (!promo.code) {
      throw new DomainValidationError(
        `Promo at index ${index} must have a code`,
      );
    }

    if (!(VALID_PROMO_TYPES as readonly string[]).includes(promo.type)) {
      throw new DomainValidationError(
        `Promo at index ${index} has invalid type: ${promo.type}`,
      );
    }

    if (typeof promo.value !== "number" || promo.value < 0) {
      throw new DomainValidationError(
        `Promo at index ${index} must have a non-negative numeric value`,
      );
    }

    if (promo.type === "percentage" && promo.value > PROMO_MAX_PERCENTAGE) {
      throw new DomainValidationError(
        `Percentage promo at index ${index} cannot exceed ${PROMO_MAX_PERCENTAGE}%`,
      );
    }

    if (!(promo.appliedAt instanceof Date)) {
      throw new DomainValidationError(
        `Promo at index ${index} must have a valid appliedAt date`,
      );
    }
  }

  private removeDuplicates(promos: PromoData[]): PromoData[] {
    const seen = new Set<string>();
    return promos.filter((promo) => {
      if (seen.has(promo.id)) {
        return false;
      }
      seen.add(promo.id);
      return true;
    });
  }

  getValue(): PromoData[] {
    return [...this.value];
  }

  equals(other: AppliedPromos): boolean {
    if (this.value.length !== other.value.length) {
      return false;
    }

    return this.value.every((promo, index) => {
      const otherPromo = other.value[index];
      return (
        promo.id === otherPromo.id &&
        promo.code === otherPromo.code &&
        promo.type === otherPromo.type &&
        promo.value === otherPromo.value
      );
    });
  }

  toString(): string {
    return JSON.stringify(this.value);
  }

  // Business methods
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  count(): number {
    return this.value.length;
  }

  hasPromo(promoId: string): boolean {
    return this.value.some((promo) => promo.id === promoId);
  }

  getPromo(promoId: string): PromoData | undefined {
    return this.value.find((promo) => promo.id === promoId);
  }

  getPromoCodes(): string[] {
    return this.value.map((promo) => promo.code);
  }

  getTotalPercentageDiscount(): number {
    return this.value
      .filter((promo) => promo.type === "percentage")
      .reduce((total, promo) => total + promo.value, 0);
  }

  getTotalFixedDiscount(): number {
    return this.value
      .filter((promo) => promo.type === "fixed_amount")
      .reduce((total, promo) => total + promo.value, 0);
  }

  hasFreeShipping(): boolean {
    return this.value.some((promo) => promo.type === "free_shipping");
  }

  addPromo(promo: PromoData): AppliedPromos {
    if (this.hasPromo(promo.id)) {
      throw new DomainValidationError(
        `Promo with ID ${promo.id} is already applied`,
      );
    }

    return new AppliedPromos([...this.value, promo]);
  }

  removePromo(promoId: string): AppliedPromos {
    const filteredPromos = this.value.filter((promo) => promo.id !== promoId);

    if (filteredPromos.length === this.value.length) {
      throw new DomainValidationError(`Promo with ID ${promoId} not found`);
    }

    return new AppliedPromos(filteredPromos);
  }

  clear(): AppliedPromos {
    return new AppliedPromos([]);
  }

  static empty(): AppliedPromos {
    return new AppliedPromos([]);
  }

  static fromArray(promos: PromoData[]): AppliedPromos {
    return new AppliedPromos(promos);
  }

  static fromJSON(json: string): AppliedPromos {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        throw new DomainValidationError(
          "JSON must represent an array of promos",
        );
      }

      // Convert appliedAt strings back to Date objects
      const promos = parsed.map((promo) => ({
        ...promo,
        appliedAt: new Date(promo.appliedAt),
      }));

      return new AppliedPromos(promos);
    } catch (error) {
      throw new DomainValidationError(
        `Invalid promo JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
