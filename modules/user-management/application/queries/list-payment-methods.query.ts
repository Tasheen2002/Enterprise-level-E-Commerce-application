import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';

export interface ListPaymentMethodsQuery extends IQuery {
  readonly userId: string;
}

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsQuery, PaymentMethodDTO[]> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(query: ListPaymentMethodsQuery): Promise<PaymentMethodDTO[]> {
    return this.paymentMethodService.getUserPaymentMethods(query.userId);
  }
}
