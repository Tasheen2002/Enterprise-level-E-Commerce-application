import { ICommand } from "@/api/src/shared/application";

export interface CreateStockAlertCommand extends ICommand {
  variantId: string;
  type: string;
}
