import { ICommand } from "@/api/src/shared/application";

export interface AddStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: string;
}
