import { ICommand } from "@/api/src/shared/application";

export interface AddPaymentMethodCommand extends ICommand {
  userId: string;
  type: "card" | "wallet" | "bank" | "cod" | "gift_card";
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export interface AddPaymentMethodResult {
  paymentMethodId: string;
  userId: string;
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingAddressId?: string | null;
  isDefault: boolean;
  createdAt: Date;
}
