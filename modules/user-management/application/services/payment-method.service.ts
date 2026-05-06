import { IPaymentMethodRepository } from "../../domain/repositories/ipayment-method.repository";
import { IUserProfileRepository } from "../../domain/repositories/iuser-profile.repository";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import {
  PaymentMethod,
  PaymentMethodDTO,
} from "../../domain/entities/payment-method.entity";
import { PaymentMethodType } from "../../domain/value-objects/payment-method-type.vo";
import { PaymentMethodId } from "../../domain/value-objects/payment-method-id.vo";
import { AddressId } from "../../domain/value-objects/address-id.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  UserNotFoundError,
  AddressNotFoundError,
  PaymentMethodNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

export interface ListUserPaymentMethodsOptions {
  page?: number;
  limit?: number;
}

interface AddPaymentMethodDto {
  userId: string;
  type: PaymentMethodType;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

interface UpdatePaymentMethodDto {
  paymentMethodId: string;
  userId: string;
  type?: PaymentMethodType;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddressId?: string;
  providerRef?: string;
  isDefault?: boolean;
}

export class PaymentMethodService {
  constructor(
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly userRepository: IUserRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly userProfileRepository: IUserProfileRepository,
  ) { }

  async addPaymentMethod(dto: AddPaymentMethodDto): Promise<PaymentMethodDTO> {
    const userId = UserId.fromString(dto.userId);

    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();

    if (dto.billingAddressId) {
      await this.validateBillingAddress(dto.billingAddressId, userId);
    }

    const existingMethods = await this.paymentMethodRepository.findByUserId(userId);
    const shouldBeDefault = dto.isDefault || existingMethods.length === 0;

    // De-default others FIRST so the new payment method is created already-default,
    // emitting only PaymentMethodAddedEvent (no extra PaymentMethodSetAsDefaultEvent).
    if (shouldBeDefault) {
      await this.clearOtherDefaults(userId);
    }

    const paymentMethod = PaymentMethod.create({
      userId: dto.userId,
      type: dto.type,
      brand: dto.brand,
      last4: dto.last4,
      expMonth: dto.expMonth,
      expYear: dto.expYear,
      billingAddressId: dto.billingAddressId,
      providerRef: dto.providerRef,
      isDefault: shouldBeDefault,
    });

    await this.paymentMethodRepository.save(paymentMethod);
    if (dto.isDefault === true || (typeof shouldBeDefault !== 'undefined' && shouldBeDefault)) {
      await this.syncUserProfileDefault(userId, paymentMethod.id);
    }

    return PaymentMethod.toDTO(paymentMethod);
  }

  async updatePaymentMethod(dto: UpdatePaymentMethodDto): Promise<PaymentMethodDTO> {
    const userId = UserId.fromString(dto.userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(dto.paymentMethodId);
    const paymentMethod = await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) throw new PaymentMethodNotFoundError();
    if (!paymentMethod.belongsToUser(userId)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    if (dto.billingAddressId) {
      await this.validateBillingAddress(dto.billingAddressId, userId);
    }

    // Note: payment method type, brand, and last4 are immutable after creation.
    // Only billing address, provider ref, and expiry can change.
    if (dto.expMonth !== undefined && dto.expYear !== undefined) {
      paymentMethod.updateExpiry(dto.expMonth, dto.expYear);
    }
    if (dto.billingAddressId !== undefined) {
      paymentMethod.updateBillingAddress(dto.billingAddressId);
    }
    if (dto.providerRef !== undefined) {
      paymentMethod.updateProviderRef(dto.providerRef);
    }

    if (dto.isDefault === true) {
      await this.clearOtherDefaults(userId, paymentMethod.id);
      paymentMethod.setAsDefault();
    } else if (dto.isDefault === false) {
      paymentMethod.removeAsDefault();
    }

    await this.paymentMethodRepository.save(paymentMethod);
    if (dto.isDefault === true) {
      await this.syncUserProfileDefault(userId, paymentMethod.id);
    }
    return PaymentMethod.toDTO(paymentMethod);
  }

  async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(paymentMethodId);
    const paymentMethod = await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) throw new PaymentMethodNotFoundError();
    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    const wasDefault = paymentMethod.isDefault;
    await this.paymentMethodRepository.delete(paymentMethodIdVo);

    // If this was the default, auto-assign a new default
    if (wasDefault) {
      const remaining = await this.paymentMethodRepository.findByUserId(userIdVo);
      if (remaining.length > 0) {
        remaining[0].setAsDefault();
        await this.paymentMethodRepository.save(remaining[0]);
        await this.syncUserProfileDefault(userIdVo, remaining[0].id);
      } else {
        await this.clearUserProfileDefault(userIdVo);
      }
    }
  }

  // PERF: a user's saved payment methods are bounded (typically <10). Repo
  // returns all rows; we slice in memory. Switch to repo-side pagination if
  // counts ever grow large.
  async getUserPaymentMethods(
    userId: string,
    options: ListUserPaymentMethodsOptions = {},
  ): Promise<PaginatedResult<PaymentMethodDTO>> {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const userIdVo = UserId.fromString(userId);
    const allMethods = await this.paymentMethodRepository.findByUserId(userIdVo);
    const total = allMethods.length;
    const items = allMethods.slice(offset, offset + limit).map((pm) => PaymentMethod.toDTO(pm));

    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<PaymentMethodDTO> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(paymentMethodId);
    const paymentMethod = await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) throw new PaymentMethodNotFoundError();
    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    await this.clearOtherDefaults(userIdVo, paymentMethod.id);
    paymentMethod.setAsDefault();
    await this.paymentMethodRepository.save(paymentMethod);
    await this.syncUserProfileDefault(userIdVo, paymentMethod.id);
    return PaymentMethod.toDTO(paymentMethod);
  }

  // --- Private helpers ---

  /**
   * Removes the `default` flag from any other payment method the user has,
   * except the one being promoted (if provided). Persists each de-defaulted method.
   */
  private async clearOtherDefaults(
    userId: UserId,
    exceptPaymentMethodId?: PaymentMethodId,
  ): Promise<void> {
    const allMethods = await this.paymentMethodRepository.findByUserId(userId);
    for (const existing of allMethods) {
      if (!existing.isDefault) continue;
      if (exceptPaymentMethodId && existing.id.equals(exceptPaymentMethodId)) continue;
      existing.removeAsDefault();
      await this.paymentMethodRepository.save(existing);
    }
  }

  private async validateBillingAddress(
    addressId: string,
    userId: UserId,
  ): Promise<void> {
    const address = await this.addressRepository.findById(AddressId.fromString(addressId));

    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userId)) {
      throw new InvalidOperationError("Billing address does not belong to user");
    }
    if (!address.isValidForBilling()) {
      throw new InvalidOperationError("Address is not valid for billing");
    }
  }

  private async syncUserProfileDefault(userId: UserId, paymentMethodId: PaymentMethodId): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (profile) {
      profile.setDefaultPaymentMethod(paymentMethodId.getValue());
      await this.userProfileRepository.save(profile);
    }
  }

  private async clearUserProfileDefault(userId: UserId): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (profile) {
      profile.removeDefaultPaymentMethod();
      await this.userProfileRepository.save(profile);
    }
  }
}
