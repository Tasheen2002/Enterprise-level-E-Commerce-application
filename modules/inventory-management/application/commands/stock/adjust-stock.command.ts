import { ICommand } from "@/api/src/shared/application";

export interface AdjustStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
}
