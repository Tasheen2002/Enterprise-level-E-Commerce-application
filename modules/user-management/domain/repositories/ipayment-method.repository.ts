import {
  PaymentMethod,
  PaymentMethodType,
} from "../entities/payment-method.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface IPaymentMethodRepository {
  // Core CRUD operations
  save(paymentMethod: PaymentMethod): Promise<void>;
  findById(id: string): Promise<PaymentMethod | null>;
  findByUserId(userId: UserId): Promise<PaymentMethod[]>;
  update(paymentMethod: PaymentMethod): Promise<void>;
  delete(id: string): Promise<void>;

  // Query operations
  findByUserIdAndType(
    userId: UserId,
    type: PaymentMethodType
  ): Promise<PaymentMethod[]>;
  findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null>;
  findByBillingAddressId(addressId: string): Promise<PaymentMethod[]>;
  findByProviderRef(providerRef: string): Promise<PaymentMethod | null>;

  // Business operations
  existsById(id: string): Promise<boolean>;
  setAsDefault(paymentMethodId: string, userId: UserId): Promise<void>;
  removeDefault(userId: UserId): Promise<void>;
  countByUserId(userId: UserId): Promise<number>;

  // Validation operations
  findExpiredPaymentMethods(beforeDate?: Date): Promise<PaymentMethod[]>;
  findExpiringSoon(monthsAhead?: number): Promise<PaymentMethod[]>;
  findByUserIdAndLast4(userId: UserId, last4: string): Promise<PaymentMethod[]>;

  // Analytics operations
  getPaymentMethodStatsByType(): Promise<
    Array<{
      type: string;
      count: number;
    }>
  >;

  getUserPaymentMethodStats(userId: UserId): Promise<{
    total: number;
    byType: Record<string, number>;
    hasDefault: boolean;
    expiredCount: number;
    expiringSoonCount: number;
  }>;

  // Batch operations
  findByIds(ids: string[]): Promise<PaymentMethod[]>;
  deleteByUserId(userId: UserId): Promise<number>;
  deleteExpired(beforeDate: Date): Promise<number>;
  findByUserIds(userIds: UserId[]): Promise<PaymentMethod[]>;
}
