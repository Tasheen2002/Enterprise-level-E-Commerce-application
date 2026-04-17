import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService, LoyaltyTransactionData } from '../services/loyalty.service';

export interface GetTransactionsQuery extends IQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface TransactionHistoryResult {
  transactions: LoyaltyTransactionData[];
  limit: number;
  offset: number;
}

export class GetTransactionsHandler implements IQueryHandler<
  GetTransactionsQuery,
  TransactionHistoryResult
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetTransactionsQuery): Promise<TransactionHistoryResult> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const transactions = await this.loyaltyService.getTransactionHistory(
      query.userId,
      limit,
      offset,
    );

    return { transactions, limit, offset };
  }
}
