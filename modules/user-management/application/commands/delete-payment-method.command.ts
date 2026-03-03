import { ICommand } from "@/api/src/shared/application";

export interface DeletePaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
}

export interface DeletePaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  deleted: boolean;
  message: string;
}
