import { PaymentIntent } from '../entities/payment-intent.entity';
import { PaymentIntentId } from '../value-objects/payment-intent-id.vo';
import { PaymentIntentStatus } from '../value-objects/payment-intent-status.vo';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface PaymentIntentFilters {
  orderId?: string;
  provider?: string;
  status?: PaymentIntentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface IPaymentIntentRepository {
  save(intent: PaymentIntent): Promise<void>;
  delete(id: PaymentIntentId): Promise<void>;
  findById(id: PaymentIntentId): Promise<PaymentIntent | null>;
  findByOrderId(orderId: string): Promise<PaymentIntent[]>;
  findByCheckoutId(checkoutId: string): Promise<PaymentIntent | null>;
  findByIdempotencyKey(key: string): Promise<PaymentIntent | null>;
  findByClientSecret(secret: string): Promise<PaymentIntent | null>;
  findWithFilters(filters: PaymentIntentFilters, options?: PaymentIntentQueryOptions): Promise<PaginatedResult<PaymentIntent>>;
  count(filters?: PaymentIntentFilters): Promise<number>;
  exists(id: PaymentIntentId): Promise<boolean>;
}

export interface PaymentIntentQueryOptions extends PaginationOptions {
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
