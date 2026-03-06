import { ICommand } from "@/api/src/shared/application";

export interface RemoveOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
}
