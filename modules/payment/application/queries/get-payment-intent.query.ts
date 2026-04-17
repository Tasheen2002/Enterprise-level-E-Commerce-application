import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentService } from '../services/payment.service';
import { PaymentIntentDTO } from '../../domain/entities/payment-intent.entity';

export interface GetPaymentIntentQuery extends IQuery {
  readonly intentId?: string;
  readonly orderId?: string;
  readonly userId?: string;
}

export class GetPaymentIntentHandler implements IQueryHandler<
  GetPaymentIntentQuery,
  PaymentIntentDTO
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(query: GetPaymentIntentQuery): Promise<PaymentIntentDTO> {
    if (!query.intentId && !query.orderId) {
      throw new Error('Either intentId or orderId is required');
    }

    return query.intentId
      ? this.paymentService.getPaymentIntent(query.intentId, query.userId)
      : this.paymentService.getPaymentIntentByOrderId(query.orderId!, query.userId);
  }
}
