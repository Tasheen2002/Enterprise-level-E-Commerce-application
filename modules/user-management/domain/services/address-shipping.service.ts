import { Address } from '../entities/address.entity';
import { ShippingZone } from '../enums/shipping-zone.enum';

export interface AddressLabel {
  recipient: string;
  addressLines: string[];
  cityStateZip: string;
  country: string;
  type: 'SHIPPING' | 'BILLING';
}

/**
 * Domain service that encapsulates shipping and logistics logic derived from
 * an Address. Kept separate from the Address entity because these calculations
 * require cross-cutting domain knowledge (zones, customs, tax jurisdictions)
 * that goes beyond what the entity itself should know about its own state.
 */
export class AddressShippingService {
  static calculateShippingZone(address: Address): ShippingZone {
    const country = address.addressValue.country;
    switch (country) {
      case 'US':
        return ShippingZone.DOMESTIC;
      case 'CA':
      case 'MX':
        return ShippingZone.NORTH_AMERICA;
      case 'UK':
      case 'FR':
      case 'DE':
      case 'IT':
      case 'ES':
        return ShippingZone.EUROPE;
      default:
        return ShippingZone.INTERNATIONAL;
    }
  }

  static estimateDeliveryDays(address: Address): number {
    const zone = AddressShippingService.calculateShippingZone(address);
    switch (zone) {
      case ShippingZone.DOMESTIC:
        return 3;
      case ShippingZone.NORTH_AMERICA:
        return 7;
      case ShippingZone.EUROPE:
        return 10;
      case ShippingZone.INTERNATIONAL:
        return 14;
      default:
        return 14;
    }
  }

  static isInternationalShipping(address: Address, fromCountry: string = 'US'): boolean {
    return address.addressValue.isInternational(fromCountry);
  }

  static requiresCustomsDeclaration(address: Address): boolean {
    return AddressShippingService.isInternationalShipping(address);
  }

  static getTaxJurisdiction(address: Address): string {
    const country = address.addressValue.country;
    const state = address.addressValue.state;
    if (country === 'US' && state) return `${country}-${state}`;
    return country;
  }

  static getShippingLabel(address: Address): AddressLabel {
    const formatted = address.addressValue.getFormattedAddress();
    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: 'SHIPPING',
    };
  }

  static getBillingLabel(address: Address): AddressLabel {
    const formatted = address.addressValue.getFormattedAddress();
    return {
      recipient: formatted.recipient,
      addressLines: formatted.street,
      cityStateZip: formatted.cityStateZip,
      country: formatted.country,
      type: 'BILLING',
    };
  }
}
