import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  GiftCardService,
  GiftCardTransactionDto,
} from "../services/gift-card.service";

export interface GetGiftCardTransactionsQuery extends IQuery {
  giftCardId: string;
}

export class GetGiftCardTransactionsHandler implements IQueryHandler<
  GetGiftCardTransactionsQuery,
  QueryResult<GiftCardTransactionDto[]>
> {
  constructor(private readonly giftCardService: GiftCardService) {}

  async handle(
    query: GetGiftCardTransactionsQuery,
  ): Promise<QueryResult<GiftCardTransactionDto[]>> {
    try {
      if (!query.giftCardId) {
        return QueryResult.failure<GiftCardTransactionDto[]>(
          "giftCardId is required",
        );
      }

      const txns = await this.giftCardService.getGiftCardTransactions(
        query.giftCardId,
      );
      return QueryResult.success<GiftCardTransactionDto[]>(txns);
    } catch (error) {
      return QueryResult.failure<GiftCardTransactionDto[]>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving gift card transactions",
      );
    }
  }
}
