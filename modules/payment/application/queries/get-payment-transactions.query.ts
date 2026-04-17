import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentTransactionDto } from '../services/payment.service';

export interface GetPaymentTransactionsQuery extends IQuery {
  readonly intentId: string;
  readonly userId?: string;
}

export class GetPaymentTransactionsHandler implements IQueryHandler<
  GetPaymentTransactionsQuery,
  QueryResult<PaymentTransactionDto[]>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(query: GetPaymentTransactionsQuery): Promise<QueryResult<PaymentTransactionDto[]>> {
    const txns = await this.paymentService.getPaymentTransactions(query.intentId, query.userId);
    return QueryResult.success(txns);
  }
}
