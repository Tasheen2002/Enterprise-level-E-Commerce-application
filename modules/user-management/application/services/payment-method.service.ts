import { IPaymentMethodRepository } from "../../domain/repositories/ipayment-method.repository";
import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import {
  PaymentMethod,
  PaymentMethodType,
} from "../../domain/entities/payment-method.entity";
import { UserId } from "../../domain/value-objects/user-id.vo";

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

export interface PaymentMethodResponseDto {
  id: string;
  userId: string;
  type: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  billingAddressId?: string | null;
  providerRef?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpired?: boolean;
  billingAddress?: {
    id: string;
    addressLine1: string;
    city: string;
    country: string;
  };
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
    private readonly addressRepository: IAddressRepository
  ) {}

  async addPaymentMethod(
    dto: AddPaymentMethodDto
  ): Promise<PaymentMethodResponseDto> {
    const userId = UserId.fromString(dto.userId);

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate billing address if provided
    if (dto.billingAddressId) {
      await this.validateBillingAddress(dto.billingAddressId, userId);
    }

    // Validate payment method data
    const validation = this.validatePaymentMethodData(dto);
    if (!validation.isValid) {
      throw new Error(
        `Invalid payment method: ${validation.errors.join(", ")}`
      );
    }

    // Check if user already has payment methods
    const existingMethods = await this.paymentMethodRepository.findByUserId(
      userId
    );

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

    return this.mapToResponseDto(paymentMethod);
  }

  async updatePaymentMethod(
    dto: UpdatePaymentMethodDto
  ): Promise<PaymentMethodResponseDto> {
    const userId = UserId.fromString(dto.userId);
    const paymentMethod = await this.paymentMethodRepository.findById(
      dto.paymentMethodId
    );

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (!paymentMethod.belongsToUser(userId)) {
      throw new Error("Payment method does not belong to user");
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

    await this.paymentMethodRepository.update(paymentMethod);

    return this.mapToResponseDto(paymentMethod);
  }

  async deletePaymentMethod(
    paymentMethodId: string,
    userId: string
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethod = await this.paymentMethodRepository.findById(
      paymentMethodId
    );

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new Error("Payment method does not belong to user");
    }

    if (!paymentMethod.canBeDeleted()) {
      throw new Error("Payment method cannot be deleted");
    }

    await this.paymentMethodRepository.delete(paymentMethodId);

    // If this was the default payment method, set another as default
    if (paymentMethod.getIsDefault()) {
      const remainingMethods = await this.paymentMethodRepository.findByUserId(
        userIdVo
      );
      if (remainingMethods.length > 0) {
        await this.paymentMethodRepository.setAsDefault(
          remainingMethods[0].getId(),
          userIdVo
        );
      }
    }
  }

  async getUserPaymentMethods(
    userId: string
  ): Promise<PaymentMethodResponseDto[]> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethods = await this.paymentMethodRepository.findByUserId(
      userIdVo
    );

    const responseDtos = await Promise.all(
      paymentMethods.map(async (method) => {
        const dto = this.mapToResponseDto(method);

        // Add billing address details if available
        if (method.getBillingAddressId()) {
          const address = await this.addressRepository.findById(
            method.getBillingAddressId()!
          );
          if (address) {
            const addressData = address.getAddressValue().toData();
            dto.billingAddress = {
              id: address.getId(),
              addressLine1: addressData.addressLine1,
              city: addressData.city,
              country: addressData.country,
            };
          }
        }

        return dto;
      })
    );

    return responseDtos;
  }

  async getDefaultPaymentMethod(
    userId: string
  ): Promise<PaymentMethodResponseDto | null> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethod =
      await this.paymentMethodRepository.findDefaultByUserId(userIdVo);

    return paymentMethod ? this.mapToResponseDto(paymentMethod) : null;
  }

  async setDefaultPaymentMethod(
    paymentMethodId: string,
    userId: string
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethod = await this.paymentMethodRepository.findById(
      paymentMethodId
    );

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (!paymentMethod.belongsToUser(userIdVo)) {
      throw new Error("Payment method does not belong to user");
    }

    await this.paymentMethodRepository.setAsDefault(paymentMethodId, userIdVo);
  }

  async getPaymentMethodsByType(
    userId: string,
    type: PaymentMethodType
  ): Promise<PaymentMethodResponseDto[]> {
    const userIdVo = UserId.fromString(userId);
    const paymentMethods =
      await this.paymentMethodRepository.findByUserIdAndType(userIdVo, type);

    return paymentMethods.map((method) => this.mapToResponseDto(method));
  }

  async getExpiringPaymentMethods(
    userId: string,
    monthsAhead: number = 3
  ): Promise<PaymentMethodResponseDto[]> {
    const userIdVo = UserId.fromString(userId);
    const allPaymentMethods = await this.paymentMethodRepository.findByUserId(
      userIdVo
    );

    // Filter for expiring methods using domain logic
    const expiringMethods = allPaymentMethods.filter((method) =>
      method.isExpiringSoon(monthsAhead)
    );

    return expiringMethods.map((method) => this.mapToResponseDto(method));
  }

  async validatePaymentMethod(
    paymentMethodId: string
  ): Promise<PaymentMethodValidationResult> {
    const paymentMethod = await this.paymentMethodRepository.findById(
      paymentMethodId
    );

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
      paymentMethod.getType() === PaymentMethodType.CARD &&
      paymentMethod.isExpired()
    ) {
      errors.push("Payment method has expired");
    }

    // Check if card expires soon
    if (
      paymentMethod.getType() === PaymentMethodType.CARD &&
      paymentMethod.isExpiringSoon()
    ) {
      warnings.push("Payment method expires soon");
    }

    // Validate billing address if present
    if (paymentMethod.getBillingAddressId()) {
      const address = await this.addressRepository.findById(
        paymentMethod.getBillingAddressId()!
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
    const paymentMethods = await this.paymentMethodRepository.findByUserId(
      userIdVo
    );

    const stats = {
      total: paymentMethods.length,
      byType: {} as Record<string, number>,
      expired: 0,
      expiringSoon: 0,
      hasDefault: false,
    };

    for (const method of paymentMethods) {
      // Count by type
      const type = method.getType();
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Check if default
      if (method.getIsDefault()) {
        stats.hasDefault = true;
      }

      // Count expired and expiring cards
      if (method.getType() === PaymentMethodType.CARD) {
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
    userId: UserId
  ): Promise<void> {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Billing address not found");
    }

    if (!address.belongsToUser(userId)) {
      throw new Error("Billing address does not belong to user");
    }

    if (!address.isValidForBilling()) {
      throw new Error("Address is not valid for billing");
    }
  }

  private validatePaymentMethodData(
    dto: AddPaymentMethodDto
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

  private mapToResponseDto(
    paymentMethod: PaymentMethod
  ): PaymentMethodResponseDto {
    const dto: PaymentMethodResponseDto = {
      id: paymentMethod.getId(),
      userId: paymentMethod.getUserId().getValue(),
      type: paymentMethod.getType().toString(),
      brand: paymentMethod.getBrand(),
      last4: paymentMethod.getLast4(),
      expMonth: paymentMethod.getExpMonth(),
      expYear: paymentMethod.getExpYear(),
      billingAddressId: paymentMethod.getBillingAddressId(),
      providerRef: paymentMethod.getProviderRef(),
      isDefault: paymentMethod.getIsDefault(),
      createdAt: paymentMethod.getCreatedAt(),
      updatedAt: paymentMethod.getUpdatedAt(),
    };

    // Add expiration status for cards
    if (paymentMethod.getType() === PaymentMethodType.CARD) {
      dto.isExpired = paymentMethod.isExpired();
    }

    return dto;
  }
}
