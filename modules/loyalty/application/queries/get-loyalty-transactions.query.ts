import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyTransactionService } from '../services/loyalty-transaction.service';
import { LoyaltyTransactionDTO as LoyaltyTransactionDto } from '../../domain/entities/loyalty-transaction.entity';

export interface GetLoyaltyTransactionsQuery extends IQuery {
  readonly accountId?: string;
  readonly orderId?: string;
}

export class GetLoyaltyTransactionsHandler implements IQueryHandler<
  GetLoyaltyTransactionsQuery,
  LoyaltyTransactionDto[]
> {
  constructor(private readonly loyaltyTxnService: LoyaltyTransactionService) {}

  async handle(query: GetLoyaltyTransactionsQuery): Promise<LoyaltyTransactionDto[]> {
    if (!query.accountId && !query.orderId) {
      throw new Error('Either accountId or orderId is required');
    }

    if (query.accountId) {
      return this.loyaltyTxnService.getLoyaltyTransactionsByAccountId(query.accountId);
    }

    return this.loyaltyTxnService.getLoyaltyTransactionsByOrderId(query.orderId as string);
  }
}
