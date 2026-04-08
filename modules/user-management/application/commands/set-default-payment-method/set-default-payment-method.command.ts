import { ICommand } from "@/api/src/shared/application";

export interface SetDefaultPaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
}

export interface SetDefaultPaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  message: string;
}
