import { ICommand } from "@/api/src/shared/application";

export interface CreateOrderCommand extends ICommand {
  userId?: string;
  guestToken?: string;
  items: Array<{
    variantId: string;
    quantity: number;
    isGift?: boolean;
    giftMessage?: string;
  }>;
  source?: string;
  currency?: string;
}
