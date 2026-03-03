import { ICommand } from "@/api/src/shared/application";

export interface RecordPromotionUsageCommand extends ICommand {
  promoId: string;
  orderId: string;
  discountAmount: number;
  currency?: string;
}
