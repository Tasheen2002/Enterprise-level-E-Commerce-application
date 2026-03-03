import { ICommand } from "@/api/src/shared/application";

export interface UpdateOrderTotalsCommand extends ICommand {
  orderId: string;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}
