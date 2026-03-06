import { IQuery } from "@/api/src/shared/application";

export interface GetPaymentIntentQuery extends IQuery {
  intentId?: string;
  orderId?: string;
  userId?: string;
}
