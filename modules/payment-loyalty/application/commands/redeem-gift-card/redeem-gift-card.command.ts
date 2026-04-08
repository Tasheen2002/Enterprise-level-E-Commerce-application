import { ICommand } from "@/api/src/shared/application";

export interface RedeemGiftCardCommand extends ICommand {
  giftCardId: string;
  amount: number;
  orderId: string;
  userId?: string;
}
