import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyTransactionService } from '../services/loyalty-transaction.service';
import { LoyaltyTransactionDTO as LoyaltyTransactionDto } from '../../domain/entities/loyalty-transaction.entity';

export interface GetLoyaltyTransactionsQuery extends IQuery {
  readonly accountId?: string;
  readonly orderId?: string;
}

export class GetLoyaltyTransactionsHandler implements IQueryHandler<
  GetLoyaltyTransactionsQuery,
  QueryResult<LoyaltyTransactionDto[]>
> {
  constructor(private readonly loyaltyTxnService: LoyaltyTransactionService) {}

  async handle(query: GetLoyaltyTransactionsQuery): Promise<QueryResult<LoyaltyTransactionDto[]>> {
    if (!query.accountId && !query.orderId) {
      return QueryResult.failure('Either accountId or orderId is required');
    }

    if (query.accountId) {
      const txns = await this.loyaltyTxnService.getLoyaltyTransactionsByAccountId(query.accountId);
      return QueryResult.success(txns);
    }

    const txns = await this.loyaltyTxnService.getLoyaltyTransactionsByOrderId(query.orderId as string);
    return QueryResult.success(txns);
  }
}
