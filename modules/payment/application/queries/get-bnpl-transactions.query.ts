import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { BnplTransactionService, BnplTransactionDto } from '../services/bnpl-transaction.service';

export interface GetBnplTransactionsQuery extends IQuery {
  readonly bnplId?: string;
  readonly intentId?: string;
  readonly orderId?: string;
  readonly userId?: string;
}

export class GetBnplTransactionsHandler implements IQueryHandler<
  GetBnplTransactionsQuery,
  BnplTransactionDto[]
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(query: GetBnplTransactionsQuery): Promise<BnplTransactionDto[]> {
    if (!query.bnplId && !query.intentId && !query.orderId) {
      throw new Error('At least one of bnplId, intentId, or orderId is required');
    }

    if (query.bnplId) {
      const txn = await this.bnplService.getBnplTransaction(query.bnplId, query.userId);
      return txn ? [txn] : [];
    }
    if (query.intentId) {
      const txn = await this.bnplService.getBnplTransactionByIntentId(query.intentId, query.userId);
      return txn ? [txn] : [];
    }
    return this.bnplService.getBnplTransactionsByOrderId(query.orderId!, query.userId);
  }
}
