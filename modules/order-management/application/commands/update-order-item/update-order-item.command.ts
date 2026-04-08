import { ICommand } from "@/api/src/shared/application";

export interface UpdateOrderItemCommand extends ICommand {
  orderId: string;
  itemId: string;
  quantity?: number;
  isGift?: boolean;
  giftMessage?: string;
}
