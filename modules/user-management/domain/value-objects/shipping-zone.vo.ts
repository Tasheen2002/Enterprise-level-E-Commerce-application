import { DomainValidationError } from "../errors/user-management.errors";

// The canonical TS enum for shipping zones lives in this file alongside
// helper methods (namespace-augmented) — not in a separate `enums/`
// directory. Augmentation matches the module's `PaymentMethodType` /
// `SocialProvider` pattern.
export enum ShippingZone {
  DOMESTIC = "domestic",
  NORTH_AMERICA = "north_america",
  EUROPE = "europe",
  INTERNATIONAL = "international",
}

const ALL_SHIPPING_ZONES: readonly ShippingZone[] = [
  ShippingZone.DOMESTIC,
  ShippingZone.NORTH_AMERICA,
  ShippingZone.EUROPE,
  ShippingZone.INTERNATIONAL,
];

export namespace ShippingZone {
  export function fromString(zone: string): ShippingZone {
    if (!zone || typeof zone !== "string") {
      throw new DomainValidationError(
        "Shipping zone must be a non-empty string",
      );
    }
    const normalized = zone.toLowerCase();
    if (!ALL_SHIPPING_ZONES.includes(normalized as ShippingZone)) {
      throw new DomainValidationError(`Invalid shipping zone: ${zone}`);
    }
    return normalized as ShippingZone;
  }

  export function getAllValues(): ShippingZone[] {
    return [...ALL_SHIPPING_ZONES];
  }

  export function getDisplayName(zone: ShippingZone): string {
    switch (zone) {
      case ShippingZone.DOMESTIC: return "Domestic";
      case ShippingZone.NORTH_AMERICA: return "North America";
      case ShippingZone.EUROPE: return "Europe";
      case ShippingZone.INTERNATIONAL: return "International";
    }
  }
}
