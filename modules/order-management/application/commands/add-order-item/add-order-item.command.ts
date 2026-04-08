import { ICommand } from "@/api/src/shared/application";

export interface AddOrderItemCommand extends ICommand {
  orderId: string;
  variantId: string;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
}
