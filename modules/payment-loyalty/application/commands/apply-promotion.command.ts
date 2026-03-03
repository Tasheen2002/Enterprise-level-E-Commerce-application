import { ICommand } from "@/api/src/shared/application";

export interface ApplyPromotionCommand extends ICommand {
  promoCode: string;
  orderId?: string;
  orderAmount: number;
  currency?: string;
  products?: string[];
  categories?: string[];
}
