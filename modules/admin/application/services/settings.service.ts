export interface ShippingRates {
  colombo: number;
  suburbs: number;
}

export interface SettingsServiceConfig {
  defaultShippingRates: ShippingRates;
}

export class SettingsService {
  private readonly config: SettingsServiceConfig;

  constructor(config?: Partial<SettingsServiceConfig>) {
    this.config = {
      defaultShippingRates: config?.defaultShippingRates ?? {
        colombo: 0,
        suburbs: 0,
      },
    };
  }

  async getShippingRates(): Promise<ShippingRates> {
    // TODO: Fetch from database when settings persistence is implemented
    return this.config.defaultShippingRates;
  }
}
