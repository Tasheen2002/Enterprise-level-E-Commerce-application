import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { LoyaltyService } from '../services/loyalty.service';
import { LoyaltyTransactionDTO } from '../../domain/entities/loyalty-transaction.entity';
import { LoyaltyValidationError } from '../../domain/errors';

export interface GetLoyaltyTransactionsQuery extends IQuery {
  readonly accountId?: string;
  readonly orderId?: string;
}

export class GetLoyaltyTransactionsHandler implements IQueryHandler<
  GetLoyaltyTransactionsQuery,
  LoyaltyTransactionDTO[]
> {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  async handle(query: GetLoyaltyTransactionsQuery): Promise<LoyaltyTransactionDTO[]> {
    if (!query.accountId && !query.orderId) {
      throw new LoyaltyValidationError('Either accountId or orderId is required');
    }

    if (query.accountId) {
      return this.loyaltyService.getLoyaltyTransactionsByAccountId(query.accountId);
    }

    return this.loyaltyService.getLoyaltyTransactionsByOrderId(query.orderId!);
  }
}
