import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';

export interface ListPaymentMethodsInput extends IQuery {
  userId: string;
}

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsInput, PaymentMethodDTO[]> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(input: ListPaymentMethodsInput): Promise<PaymentMethodDTO[]> {
    return this.paymentMethodService.getUserPaymentMethods(input.userId);
  }
}
