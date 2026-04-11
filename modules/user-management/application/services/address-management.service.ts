import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import { Address, AddressDTO } from "../../domain/entities/address.entity";
import { AddressId } from "../../domain/value-objects/address-id";
import {
  AddressType,
  AddressData,
} from "../../domain/value-objects/address.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  AddressNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";

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

export class AddressManagementService {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async addAddress(dto: AddAddressDto): Promise<AddressDTO> {
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
      throw new InvalidOperationError(
        "A similar address already exists for this user",
      );
    }

    if (shouldBeDefault) {
      await this.addressRepository.removeDefault(userId);
    }
    await this.addressRepository.save(address);

    const result = Address.toDTO(address);
    return result;
  }

  async updateAddress(dto: UpdateAddressDto): Promise<AddressDTO> {
    const userId = UserId.fromString(dto.userId);
    const addressId = AddressId.fromString(dto.addressId);
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw new AddressNotFoundError();
    }

    if (!address.belongsToUser(userId)) {
      throw new InvalidOperationError("Address does not belong to user");
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

    await this.addressRepository.save(address);

    return Address.toDTO(address);
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    if (!address.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Address does not belong to user");
    }

    if (!address.canBeDeleted()) {
      throw new InvalidOperationError("Address cannot be deleted");
    }

    await this.addressRepository.delete(addressIdVo);

    // If this was the default address, we might want to set another as default
    if (address.isDefault) {
      const remainingAddresses =
        await this.addressRepository.findByUserId(userIdVo);
      if (remainingAddresses.length > 0) {
        await this.addressRepository.setAsDefault(
          remainingAddresses[0].id,
          userIdVo,
        );
      }
    }
  }

  async getUserAddresses(userId: string): Promise<AddressDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserId(userIdVo);

    return addresses.map((address) => Address.toDTO(address));
  }

  async getUserAddressesByType(
    userId: string,
    type: AddressType,
  ): Promise<AddressDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserIdAndType(
      userIdVo,
      type,
    );

    return addresses.map((address) => Address.toDTO(address));
  }

  async getDefaultAddress(userId: string): Promise<AddressDTO> {
    const userIdVo = UserId.fromString(userId);
    const address = await this.addressRepository.findDefaultByUserId(userIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    return Address.toDTO(address);
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    if (!address.belongsToUser(userIdVo)) {
      throw new InvalidOperationError("Address does not belong to user");
    }

    await this.addressRepository.setAsDefault(addressIdVo, userIdVo);
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
        error instanceof Error ? error.message : "Invalid address format",
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

  async estimateDeliveryDays(addressId: string): Promise<number> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    return address.estimateDeliveryDays();
  }

  async getShippingZone(addressId: string): Promise<string> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    return address.calculateShippingZone();
  }

  async requiresCustomsDeclaration(addressId: string): Promise<boolean> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) {
      throw new AddressNotFoundError();
    }

    return address.requiresCustomsDeclaration();
  }

  async bulkDeleteUserAddresses(userId: string): Promise<number> {
    const userIdVo = UserId.fromString(userId);
    return await this.addressRepository.deleteByUserId(userIdVo);
  }

}
