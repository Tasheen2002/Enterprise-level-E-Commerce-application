import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import { Address } from "../../domain/entities/address.entity";
import {
  AddressType,
  AddressData,
} from "../../domain/value-objects/address.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";

export interface AddAddressDto {
  userId: string;
  addressData: AddressData;
  type: AddressType;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  addressId: string;
  userId: string;
  addressData?: AddressData;
  type?: AddressType;
  isDefault?: boolean;
}

export interface AddressResponseDto {
  id: string;
  userId: string;
  type: string;
  isDefault: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressStatsDto {
  total: number;
  byType: Record<string, number>;
  hasDefault: boolean;
}

export class AddressManagementService {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async addAddress(dto: AddAddressDto): Promise<AddressResponseDto> {
    const userId = UserId.fromString(dto.userId);

    const existingAddresses = await this.addressRepository.findByUserId(userId);

    const shouldBeDefault = dto.isDefault || existingAddresses.length === 0;

    const address = Address.create({
      userId: dto.userId,
      addressData: dto.addressData,
      type: dto.type,
      isDefault: shouldBeDefault,
    });

    const conflictingAddress =
      await this.addressRepository.findConflictingAddress(userId, address);
    if (conflictingAddress) {
      throw new Error("A similar address already exists for this user");
    }

    if (shouldBeDefault) {
      await this.addressRepository.removeDefault(userId);
    }
    await this.addressRepository.save(address);

    const result = this.mapToResponseDto(address);
    return result;
  }

  async updateAddress(dto: UpdateAddressDto): Promise<AddressResponseDto> {
    const userId = UserId.fromString(dto.userId);
    const address = await this.addressRepository.findById(dto.addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    if (!address.belongsToUser(userId)) {
      throw new Error("Address does not belong to user");
    }

    if (dto.addressData) {
      address.updateAddress(dto.addressData);
    }
    if (dto.type) {
      address.changeType(dto.type);
    }

    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        await this.addressRepository.removeDefault(userId);
        address.setAsDefault();
      } else {
        address.removeAsDefault();
      }
    }

    await this.addressRepository.update(address);

    return this.mapToResponseDto(address);
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    if (!address.belongsToUser(userIdVo)) {
      throw new Error("Address does not belong to user");
    }

    if (!address.canBeDeleted()) {
      throw new Error("Address cannot be deleted");
    }

    await this.addressRepository.delete(addressId);

    // If this was the default address, we might want to set another as default
    if (address.getIsDefault()) {
      const remainingAddresses = await this.addressRepository.findByUserId(
        userIdVo
      );
      if (remainingAddresses.length > 0) {
        await this.addressRepository.setAsDefault(
          remainingAddresses[0].getId(),
          userIdVo
        );
      }
    }
  }

  async getUserAddresses(userId: string): Promise<AddressResponseDto[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserId(userIdVo);

    return addresses.map((address) => this.mapToResponseDto(address));
  }

  async getUserAddressesByType(
    userId: string,
    type: AddressType
  ): Promise<AddressResponseDto[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserIdAndType(
      userIdVo,
      type
    );

    return addresses.map((address) => this.mapToResponseDto(address));
  }

  async getDefaultAddress(userId: string): Promise<AddressResponseDto | null> {
    const userIdVo = UserId.fromString(userId);
    const address = await this.addressRepository.findDefaultByUserId(userIdVo);

    return address ? this.mapToResponseDto(address) : null;
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    if (!address.belongsToUser(userIdVo)) {
      throw new Error("Address does not belong to user");
    }

    await this.addressRepository.setAsDefault(addressId, userIdVo);
  }

  async validateAddress(addressData: AddressData): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      // Create a temporary address to validate structure
      const tempAddress = Address.create({
        userId: "temp-user-id",
        addressData,
        type: AddressType.SHIPPING,
      });

      // Check if address is complete for shipping
      if (!tempAddress.isValidForShipping()) {
        errors.push("Address is not complete for shipping");
      }

      // Check if address is complete for billing
      if (!tempAddress.isValidForBilling()) {
        errors.push("Address is not complete for billing");
      }
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Invalid address format"
      );
    }

    // Add suggestions for common issues
    if (
      !addressData.postalCode &&
      ["US", "CA", "UK"].includes(addressData.country)
    ) {
      suggestions.push("Postal code is recommended for this country");
    }

    if (!addressData.state && addressData.country === "US") {
      suggestions.push("State is required for US addresses");
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  async findSimilarAddresses(
    addressData: AddressData,
    threshold: number = 0.8
  ): Promise<AddressResponseDto[]> {
    const tempAddress = Address.create({
      userId: "temp-user-id",
      addressData,
      type: AddressType.SHIPPING,
    });

    const similarAddresses = await this.addressRepository.findSimilarAddresses(
      tempAddress,
      threshold
    );

    return similarAddresses.map((address) => this.mapToResponseDto(address));
  }

  async getUserAddressStats(userId: string): Promise<AddressStatsDto> {
    const userIdVo = UserId.fromString(userId);
    return await this.addressRepository.getUserAddressStats(userIdVo);
  }

  async getAddressStatsByCountry(): Promise<
    Array<{ country: string; count: number }>
  > {
    return await this.addressRepository.getAddressStatsByCountry();
  }

  async estimateDeliveryDays(addressId: string): Promise<number> {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    return address.estimateDeliveryDays();
  }

  async getShippingZone(addressId: string): Promise<string> {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    return address.calculateShippingZone();
  }

  async requiresCustomsDeclaration(addressId: string): Promise<boolean> {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    return address.requiresCustomsDeclaration();
  }

  async bulkDeleteUserAddresses(userId: string): Promise<number> {
    const userIdVo = UserId.fromString(userId);
    return await this.addressRepository.deleteByUserId(userIdVo);
  }

  private mapToResponseDto(address: Address): AddressResponseDto {
    const addressValue = address.getAddressValue();
    const addressData = addressValue.toData();

    return {
      id: address.getId(),
      userId: address.getUserId().getValue(),
      type: address.getType().toString(),
      isDefault: address.getIsDefault(),
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      company: addressData.company,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone,
      createdAt: address.getCreatedAt(),
      updatedAt: address.getUpdatedAt(),
    };
  }
}
