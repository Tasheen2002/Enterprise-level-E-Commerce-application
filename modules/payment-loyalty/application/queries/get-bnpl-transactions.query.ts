import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  BnplTransactionService,
  BnplTransactionDto,
} from "../services/bnpl-transaction.service";

export interface GetBnplTransactionsQuery extends IQuery {
  bnplId?: string;
  intentId?: string;
  orderId?: string;
  userId?: string;
}

export class GetBnplTransactionsHandler implements IQueryHandler<
  GetBnplTransactionsQuery,
  QueryResult<BnplTransactionDto[]>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(
    query: GetBnplTransactionsQuery,
  ): Promise<QueryResult<BnplTransactionDto[]>> {
    try {
      if (!query.bnplId && !query.intentId && !query.orderId) {
        return QueryResult.failure<BnplTransactionDto[]>(
          "At least one of bnplId, intentId, or orderId is required",
        );
      }

      if (query.bnplId) {
        const txn = await this.bnplService.getBnplTransaction(
          query.bnplId,
          query.userId,
        );
        return QueryResult.success<BnplTransactionDto[]>(txn ? [txn] : []);
      }
      if (query.intentId) {
        const txn = await this.bnplService.getBnplTransactionByIntentId(
          query.intentId,
          query.userId,
        );
        return QueryResult.success<BnplTransactionDto[]>(txn ? [txn] : []);
      }
      // orderId path
      const txns = await this.bnplService.getBnplTransactionsByOrderId(
        query.orderId as string,
        query.userId,
      );
      return QueryResult.success<BnplTransactionDto[]>(txns);
    } catch (error) {
      return QueryResult.failure<BnplTransactionDto[]>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving BNPL transactions",
      );
    }
  }
}
