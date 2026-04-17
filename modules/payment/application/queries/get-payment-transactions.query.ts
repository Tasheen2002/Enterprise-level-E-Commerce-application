import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService } from '../services/payment.service';
import { PaymentTransactionDTO } from '../../domain/entities/payment-transaction.entity';

export interface GetPaymentTransactionsQuery extends IQuery {
  readonly intentId: string;
  readonly userId?: string;
}

export class GetPaymentTransactionsHandler implements IQueryHandler<
  GetPaymentTransactionsQuery,
  PaymentTransactionDTO[]
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(query: GetPaymentTransactionsQuery): Promise<PaymentTransactionDTO[]> {
    return this.paymentService.getPaymentTransactions(query.intentId, query.userId);
  }
}
