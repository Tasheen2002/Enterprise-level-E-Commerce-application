import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { QueryResult } from '../../../../packages/core/src/application/query-result';

export interface ListPaymentMethodsInput extends IQuery {
  userId: string;
}

export class ListPaymentMethodsHandler implements IQueryHandler<
  ListPaymentMethodsInput,
  QueryResult<PaymentMethodDTO[]>
> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(
    input: ListPaymentMethodsInput
  ): Promise<QueryResult<PaymentMethodDTO[]>> {
    const paymentMethods = await this.paymentMethodService.getUserPaymentMethods(
      input.userId
    );
    return QueryResult.success(paymentMethods);
  }
}
