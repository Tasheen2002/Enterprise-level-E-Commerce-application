import { ICommand } from "@/api/src/shared/application";

export interface SetStockThresholdsCommand extends ICommand {
  variantId: string;
  locationId: string;
  lowStockThreshold?: number;
  safetyStock?: number;
}
