import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';

export interface ListPaymentMethodsQuery extends IQuery {
  readonly userId: string;
}

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsQuery, QueryResult<PaymentMethodDTO[]>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  async handle(query: ListPaymentMethodsQuery): Promise<QueryResult<PaymentMethodDTO[]>> {
    try {
      const data = await this.paymentMethodService.getUserPaymentMethods(query.userId);
      return QueryResult.success(data);
    } catch (error) {
      return QueryResult.fromError(error);
    }
  }
}
