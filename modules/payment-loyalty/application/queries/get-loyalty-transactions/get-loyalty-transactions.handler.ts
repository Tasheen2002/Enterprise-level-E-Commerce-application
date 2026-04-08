import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  LoyaltyTransactionService,
  LoyaltyTransactionDto,
} from "../../services/loyalty-transaction.service";
import { GetLoyaltyTransactionsQuery } from "./get-loyalty-transactions.query";

export class GetLoyaltyTransactionsHandler implements IQueryHandler<
  GetLoyaltyTransactionsQuery,
  QueryResult<LoyaltyTransactionDto[]>
> {
  constructor(private readonly loyaltyTxnService: LoyaltyTransactionService) {}

  async handle(
    query: GetLoyaltyTransactionsQuery,
  ): Promise<QueryResult<LoyaltyTransactionDto[]>> {
    try {
      if (!query.accountId && !query.orderId) {
        return QueryResult.failure<LoyaltyTransactionDto[]>(
          "Either accountId or orderId is required",
        );
      }

      if (query.accountId) {
        const txns =
          await this.loyaltyTxnService.getLoyaltyTransactionsByAccountId(
            query.accountId,
          );
        return QueryResult.success<LoyaltyTransactionDto[]>(txns);
      }

      const txns = await this.loyaltyTxnService.getLoyaltyTransactionsByOrderId(
        query.orderId as string,
      );
      return QueryResult.success<LoyaltyTransactionDto[]>(txns);
    } catch (error) {
      return QueryResult.failure<LoyaltyTransactionDto[]>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving loyalty transactions",
      );
    }
  }
}
