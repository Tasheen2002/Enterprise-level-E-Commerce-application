import {
  PaymentMethod,
  PaymentMethodType,
} from "../entities/payment-method.entity";
import { PaymentMethodId } from "../value-objects/payment-method-id";
import { UserId } from "../value-objects/user-id.vo";

export interface IPaymentMethodRepository {
  // Core CRUD operations
  save(paymentMethod: PaymentMethod): Promise<void>;
  findById(id: PaymentMethodId): Promise<PaymentMethod | null>;
  findByUserId(userId: UserId): Promise<PaymentMethod[]>;
  delete(id: PaymentMethodId): Promise<void>;

  // Query operations
  findByUserIdAndType(
    userId: UserId,
    type: PaymentMethodType
  ): Promise<PaymentMethod[]>;
  findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null>;

  // Business operations
  setAsDefault(paymentMethodId: PaymentMethodId, userId: UserId): Promise<void>;
  removeDefault(userId: UserId): Promise<void>;
  countByUserId(userId: UserId): Promise<number>;

  // Cleanup operations
  deleteByUserId(userId: UserId): Promise<number>;
}
