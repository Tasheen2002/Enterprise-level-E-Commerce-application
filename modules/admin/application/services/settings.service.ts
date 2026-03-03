export interface ShippingRates {
  colombo: number;
  suburbs: number;
}

export class SettingsService {
  async getShippingRates(): Promise<ShippingRates> {
    // TODO: Fetch from database/config
    return {
      colombo: 0,
      suburbs: 0,
    };
  }
}
