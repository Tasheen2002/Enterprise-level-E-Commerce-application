import { IQuery } from "@/api/src/shared/application";

export interface GetGiftCardTransactionsQuery extends IQuery {
  giftCardId: string;
}
