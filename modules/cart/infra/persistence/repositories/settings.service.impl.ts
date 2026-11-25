import { IExternalSettingsService, ShippingRates } from "../../../domain/ports/external-services";

export interface SettingsServiceConfig {
  defaultShippingRates: ShippingRates;
}

export class SettingsServiceImpl implements IExternalSettingsService {
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
    // Fetch from database when settings persistence is implemented
    return this.config.defaultShippingRates;
  }
}
