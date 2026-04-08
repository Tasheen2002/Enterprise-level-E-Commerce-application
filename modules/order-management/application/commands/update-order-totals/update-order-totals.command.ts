import { ICommand } from "@/api/src/shared/application";

export interface UpdateOrderTotalsCommand extends ICommand {
  orderId: string;
  totals: {
    tax: number;
    shipping: number;
    discount: number;
  };
}
