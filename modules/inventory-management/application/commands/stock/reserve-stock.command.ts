import { ICommand } from "@/api/src/shared/application";

export interface ReserveStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
}
