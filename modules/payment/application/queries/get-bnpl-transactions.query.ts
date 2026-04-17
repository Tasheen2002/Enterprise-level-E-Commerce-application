import {
  IQuery,
  IQueryHandler,
  QueryResult,
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
  QueryResult<BnplTransactionDto[]>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(query: GetBnplTransactionsQuery): Promise<QueryResult<BnplTransactionDto[]>> {
    if (!query.bnplId && !query.intentId && !query.orderId) {
      return QueryResult.failure('At least one of bnplId, intentId, or orderId is required');
    }

    if (query.bnplId) {
      const txn = await this.bnplService.getBnplTransaction(query.bnplId, query.userId);
      return QueryResult.success(txn ? [txn] : []);
    }
    if (query.intentId) {
      const txn = await this.bnplService.getBnplTransactionByIntentId(query.intentId, query.userId);
      return QueryResult.success(txn ? [txn] : []);
    }
    const txns = await this.bnplService.getBnplTransactionsByOrderId(query.orderId!, query.userId);
    return QueryResult.success(txns);
  }
}
