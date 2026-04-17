import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService, PaymentIntentDto } from '../services/payment.service';

export interface GetPaymentIntentQuery extends IQuery {
  readonly intentId?: string;
  readonly orderId?: string;
  readonly userId?: string;
}

export class GetPaymentIntentHandler implements IQueryHandler<
  GetPaymentIntentQuery,
  QueryResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(query: GetPaymentIntentQuery): Promise<QueryResult<PaymentIntentDto>> {
    if (!query.intentId && !query.orderId) {
      return QueryResult.failure('Either intentId or orderId is required');
    }

    const intent = query.intentId
      ? await this.paymentService.getPaymentIntent(query.intentId, query.userId)
      : await this.paymentService.getPaymentIntentByOrderId(query.orderId!, query.userId);

    return QueryResult.success(intent);
  }
}
