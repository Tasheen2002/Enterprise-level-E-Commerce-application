import { IQuery } from "@/api/src/shared/application";

export interface ListPaymentMethodsQuery extends IQuery {
  userId: string;
}

export interface PaymentMethodResult {
  paymentMethodId: string;
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingAddressId?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodsListResult {
  userId: string;
  paymentMethods: PaymentMethodResult[];
  totalCount: number;
}
