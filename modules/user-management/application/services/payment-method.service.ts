import { IPaymentMethodRepository } from "../../domain/repositories/ipayment-method.repository";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import {
  PaymentMethod,
  PaymentMethodType,
  PaymentMethodDTO,
} from "../../domain/entities/payment-method.entity";
import { PaymentMethodId } from "../../domain/value-objects/payment-method-id";
import { AddressId } from "../../domain/value-objects/address-id";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  UserNotFoundError,
  AddressNotFoundError,
  PaymentMethodNotFoundError,
  InvalidOperationError,
  DomainValidationError,
} from "../../domain/errors/user-management.errors";

export interface AddPaymentMethodDto {
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

export interface UpdatePaymentMethodDto {
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

export interface PaymentMethodValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PaymentMethodService {
  constructor(
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly userRepository: IUserRepository,
    private readonly addressRepository: IAddressRepository,
  ) {}

  async addPaymentMethod(
    dto: AddPaymentMethodDto,
  ): Promise<PaymentMethodDTO> {
    const userId = UserId.fromString(dto.userId);

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Validate billing address if provided
    if (dto.billingAddressId) {
      await this.validateBillingAddress(dto.billingAddressId, userId);
    }

    // Validate payment method data
    const validation = this.validatePaymentMethodData(dto);
    if (!validation.isValid) {
      throw new DomainValidationError(
        `Invalid payment method: ${validation.errors.join(", ")}`,
      );
    }

    // Check if user already has payment methods
    const existingMethods =
      await this.paymentMethodRepository.findByUserId(userId);

    // If this is their first payment method or explicitly set as default, make it default
    const shouldBeDefault = dto.isDefault || existingMethods.length === 0;

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

    // If setting as default, remove default from other payment methods
    if (shouldBeDefault) {
      await this.paymentMethodRepository.removeDefault(userId);
    }

    await this.paymentMethodRepository.save(paymentMethod);

    return PaymentMethod.toDTO(paymentMethod);
  }

  async updatePaymentMethod(
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodDTO> {
    const userId = UserId.fromString(dto.userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(dto.paymentMethodId);
    const paymentMethod = await this.paymentMethodRepository.findById(
      paymentMethodIdVo,
    );

    if (!paymentMethod) {
      throw new PaymentMethodNotFoundError();
    }

    if (!paymentMethod.belongsToUser(userId)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    // Validate billing address if provided
    if (dto.billingAddressId) {
      await this.validateBillingAddress(dto.billingAddressId, userId);
    }

    // Note: Payment method type, brand, and last4 are typically immutable after creation
    // Only update fields that can be changed: billing address, provider ref, and expiry

    if (dto.expMonth !== undefined && dto.expYear !== undefined) {
      paymentMethod.updateExpiry(dto.expMonth, dto.expYear);
    }

    if (dto.billingAddressId !== undefined) {
      paymentMethod.updateBillingAddress(dto.billingAddressId);
    }

    if (dto.providerRef !== undefined) {
      paymentMethod.updateProviderRef(dto.providerRef);
    }

    // Handle default status
    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        await this.paymentMethodRepository.removeDefault(userId);
        paymentMethod.setAsDefault();
      } else {
        paymentMethod.removeAsDefault();
      }
    }

    await this.paymentMethodRepository.save(paymentMethod);

    return PaymentMethod.toDTO(paymentMethod);
  }

  async deletePaymentMethod(
    paymentMethodId: string,
    userId: string,
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(paymentMethodId);
    const paymentMethod =
      await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) {
      throw new PaymentMethodNotFoundError();
    }

    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    if (!paymentMethod.canBeDeleted()) {
      throw new InvalidOperationError("Payment method cannot be deleted");
    }

    await this.paymentMethodRepository.delete(paymentMethodIdVo);

    // If this was the default payment method, set another as default
    if (paymentMethod.isDefault) {
      const remainingMethods =
        await this.paymentMethodRepository.findByUserId(userIdVo);
      if (remainingMethods.length > 0) {
        await this.paymentMethodRepository.setAsDefault(
          remainingMethods[0].id,
          userIdVo,
        );
      }
    }
  }

  async getUserPaymentMethods(
    userId: string,
  ): Promise<PaymentMethodDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethods =
      await this.paymentMethodRepository.findByUserId(userIdVo);

    return paymentMethods.map((method) => PaymentMethod.toDTO(method));
  }

  async getDefaultPaymentMethod(
    userId: string,
  ): Promise<PaymentMethodDTO> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethod =
      await this.paymentMethodRepository.findDefaultByUserId(userIdVo);

    if (!paymentMethod) {
      throw new PaymentMethodNotFoundError();
    }

    return PaymentMethod.toDTO(paymentMethod);
  }

  async setDefaultPaymentMethod(
    paymentMethodId: string,
    userId: string,
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethodIdVo = PaymentMethodId.fromString(paymentMethodId);
    const paymentMethod =
      await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) {
      throw new PaymentMethodNotFoundError();
    }

    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }

    await this.paymentMethodRepository.setAsDefault(paymentMethodIdVo, userIdVo);
  }

  async getPaymentMethodsByType(
    userId: string,
    type: PaymentMethodType,
  ): Promise<PaymentMethodDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethods =
      await this.paymentMethodRepository.findByUserIdAndType(userIdVo, type);

    return paymentMethods.map((method) => PaymentMethod.toDTO(method));
  }

  async getExpiringPaymentMethods(
    userId: string,
    monthsAhead: number = 3,
  ): Promise<PaymentMethodDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const allPaymentMethods =
      await this.paymentMethodRepository.findByUserId(userIdVo);

    // Filter for expiring methods using domain logic
    const expiringMethods = allPaymentMethods.filter((method) =>
      method.isExpiringSoon(monthsAhead),
    );

    return expiringMethods.map((method) => PaymentMethod.toDTO(method));
  }

  async validatePaymentMethod(
    paymentMethodId: string,
  ): Promise<PaymentMethodValidationResult> {
    const paymentMethodIdVo = PaymentMethodId.fromString(paymentMethodId);
    const paymentMethod =
      await this.paymentMethodRepository.findById(paymentMethodIdVo);

    if (!paymentMethod) {
      return {
        isValid: false,
        errors: ["Payment method not found"],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if card is expired
    if (
      paymentMethod.type === PaymentMethodType.CARD &&
      paymentMethod.isExpired()
    ) {
      errors.push("Payment method has expired");
    }

    // Check if card expires soon
    if (
      paymentMethod.type === PaymentMethodType.CARD &&
      paymentMethod.isExpiringSoon()
    ) {
      warnings.push("Payment method expires soon");
    }

    // Validate billing address if present
    if (paymentMethod.billingAddressId) {
      const address = await this.addressRepository.findById(
        AddressId.fromString(paymentMethod.billingAddressId),
      );
      if (!address) {
        errors.push("Billing address not found");
      } else if (!address.isValidForBilling()) {
        errors.push("Billing address is incomplete");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async bulkDeleteUserPaymentMethods(userId: string): Promise<number> {
    const userIdVo = UserId.fromString(userId);
    return await this.paymentMethodRepository.deleteByUserId(userIdVo);
  }

  async getPaymentMethodStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    expired: number;
    expiringSoon: number;
    hasDefault: boolean;
  }> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethods =
      await this.paymentMethodRepository.findByUserId(userIdVo);

    const stats = {
      total: paymentMethods.length,
      byType: {} as Record<string, number>,
      expired: 0,
      expiringSoon: 0,
      hasDefault: false,
    };

    for (const method of paymentMethods) {
      // Count by type
      const type = method.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Check if default
      if (method.isDefault) {
        stats.hasDefault = true;
      }

      // Count expired and expiring cards
      if (method.type === PaymentMethodType.CARD) {
        if (method.isExpired()) {
          stats.expired++;
        } else if (method.isExpiringSoon()) {
          stats.expiringSoon++;
        }
      }
    }

    return stats;
  }

  private async validateBillingAddress(
    addressId: string,
    userId: UserId,
  ): Promise<void> {
    const address = await this.addressRepository.findById(AddressId.fromString(addressId));

    if (!address) {
      throw new AddressNotFoundError();
    }

    if (!address.belongsToUser(userId)) {
      throw new InvalidOperationError(
        "Billing address does not belong to user",
      );
    }

    if (!address.isValidForBilling()) {
      throw new InvalidOperationError("Address is not valid for billing");
    }
  }

  private validatePaymentMethodData(
    dto: AddPaymentMethodDto,
  ): PaymentMethodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate card-specific fields
    if (dto.type === PaymentMethodType.CARD) {
      if (!dto.last4) {
        errors.push("Last 4 digits are required for card payments");
      } else if (!/^\d{4}$/.test(dto.last4)) {
        errors.push("Last 4 digits must be exactly 4 numeric characters");
      }

      if (!dto.expMonth || !dto.expYear) {
        errors.push("Expiration month and year are required for card payments");
      } else {
        if (dto.expMonth < 1 || dto.expMonth > 12) {
          errors.push("Expiration month must be between 1 and 12");
        }

        const currentYear = new Date().getFullYear();
        if (dto.expYear < currentYear) {
          errors.push("Expiration year cannot be in the past");
        }

        // Check if card expires soon
        const currentDate = new Date();
        const expDate = new Date(dto.expYear, dto.expMonth - 1);
        const monthsUntilExpiry =
          (expDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30);

        if (monthsUntilExpiry < 3) {
          warnings.push("Card expires within 3 months");
        }
      }

      if (!dto.brand) {
        warnings.push("Brand is recommended for card payments");
      }
    }

    // Validate wallet-specific fields
    if (dto.type === PaymentMethodType.WALLET) {
      if (!dto.providerRef) {
        errors.push("Provider reference is required for wallet payments");
      }
    }

    // Validate bank-specific fields
    if (dto.type === PaymentMethodType.BANK) {
      if (!dto.providerRef) {
        errors.push("Provider reference is required for bank payments");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

}
