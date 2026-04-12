import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListPaymentMethodsQuery extends IQuery {
  userId: string;
}

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsQuery, PaymentMethodDTO[]> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(query: ListPaymentMethodsQuery): Promise<PaymentMethodDTO[]> {
    return this.paymentMethodService.getUserPaymentMethods(query.userId);
  }
}
