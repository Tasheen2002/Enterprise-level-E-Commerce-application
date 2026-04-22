import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { BnplTransactionService } from '../services/bnpl-transaction.service';
import { BnplTransactionDTO } from '../../domain/entities/bnpl-transaction.entity';
import { DomainValidationError } from '../../domain/errors/payment-loyalty.errors';

export interface GetBnplTransactionsQuery extends IQuery {
  readonly bnplId?: string;
  readonly intentId?: string;
  readonly orderId?: string;
  readonly userId?: string;
}

export class GetBnplTransactionsHandler implements IQueryHandler<
  GetBnplTransactionsQuery,
  BnplTransactionDTO[]
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(query: GetBnplTransactionsQuery): Promise<BnplTransactionDTO[]> {
    if (!query.bnplId && !query.intentId && !query.orderId) {
      throw new DomainValidationError('At least one of bnplId, intentId, or orderId is required');
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
