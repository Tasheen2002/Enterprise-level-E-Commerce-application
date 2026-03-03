import { ICommand } from "@/api/src/shared/application";

export interface UpdatePaymentMethodCommand extends ICommand {
  paymentMethodId: string;
  userId: string;
  billingAddressId?: string;
  isDefault?: boolean;
  expMonth?: number;
  expYear?: number;
  providerRef?: string;
}

export interface UpdatePaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  updated: boolean;
  message: string;
}
