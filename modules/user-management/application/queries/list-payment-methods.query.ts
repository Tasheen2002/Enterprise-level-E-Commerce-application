import { IQuery, IQueryHandler } from '../../../../packages/core/src/application/cqrs';
import { PaymentMethodService } from '../services/payment-method.service';
import { PaymentMethodDTO } from '../../domain/entities/payment-method.entity';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from '../../domain/constants/pagination.constants';

export interface ListPaymentMethodsQuery extends IQuery {
  readonly userId: string;
  readonly page?: number;
  readonly limit?: number;
}

export class ListPaymentMethodsHandler implements IQueryHandler<ListPaymentMethodsQuery, PaginatedResult<PaymentMethodDTO>> {
  constructor(private readonly paymentMethodService: PaymentMethodService) { }

  async handle(query: ListPaymentMethodsQuery): Promise<PaginatedResult<PaymentMethodDTO>> {
    return this.paymentMethodService.getUserPaymentMethods(query.userId, {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
    });
  }
}
