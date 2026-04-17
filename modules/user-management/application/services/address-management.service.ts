import { IAddressRepository } from '../../domain/repositories/iaddress.repository';
import { Address, AddressDTO } from '../../domain/entities/address.entity';
import { AddressId } from '../../domain/value-objects/address-id';
import {
  AddressType,
  AddressData,
} from '../../domain/value-objects/address.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import {
  AddressShippingService,
} from '../../domain/services/address-shipping.service';
import {
  AddressNotFoundError,
  InvalidOperationError,
} from '../../domain/errors/user-management.errors';

interface AddAddressParams {
  userId: string;
  addressData: AddressData;
  type: AddressType;
  isDefault?: boolean;
}

interface UpdateAddressParams {
  addressId: string;
  userId: string;
  addressData?: AddressData;
  type?: AddressType;
  isDefault?: boolean;
}

export class AddressManagementService {
  constructor(private readonly addressRepository: IAddressRepository) {}

  async addAddress(params: AddAddressParams): Promise<AddressDTO> {
    const userId = UserId.fromString(params.userId);

    const existingAddresses = await this.addressRepository.findByUserId(userId);
    const shouldBeDefault = params.isDefault || existingAddresses.length === 0;

    // Conflict check: use domain equals on address VO
    const address = Address.create({
      userId: params.userId,
      addressData: params.addressData,
      type: params.type,
      isDefault: false, // set default after de-defaulting others
    });

    const isDuplicate = existingAddresses.some((a) => a.isSameAddress(address));
    if (isDuplicate) {
      throw new InvalidOperationError('A similar address already exists for this user');
    }

    // De-default all existing addresses in-memory, then save each
    if (shouldBeDefault) {
      for (const existing of existingAddresses) {
        if (existing.isDefault) {
          existing.removeAsDefault();
          await this.addressRepository.save(existing);
        }
      }
      address.setAsDefault();
    }

    await this.addressRepository.save(address);
    return Address.toDTO(address);
  }

  async updateAddress(params: UpdateAddressParams): Promise<AddressDTO> {
    const userId = UserId.fromString(params.userId);
    const addressId = AddressId.fromString(params.addressId);
    const address = await this.addressRepository.findById(addressId);

    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userId)) {
      throw new InvalidOperationError('Address does not belong to user');
    }

    if (params.addressData) {
      address.updateAddress(params.addressData);
    }
    if (params.type) {
      address.changeType(params.type);
    }

    if (params.isDefault === true) {
      // De-default all other addresses for this user
      const allAddresses = await this.addressRepository.findByUserId(userId);
      for (const existing of allAddresses) {
        if (existing.isDefault && !existing.equals(address)) {
          existing.removeAsDefault();
          await this.addressRepository.save(existing);
        }
      }
      address.setAsDefault();
    } else if (params.isDefault === false) {
      address.removeAsDefault();
    }

    await this.addressRepository.save(address);
    return Address.toDTO(address);
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userIdVo)) {
      throw new InvalidOperationError('Address does not belong to user');
    }

    const wasDefault = address.isDefault;
    await this.addressRepository.delete(addressIdVo);

    // If this was the default, auto-assign a new default
    if (wasDefault) {
      const remaining = await this.addressRepository.findByUserId(userIdVo);
      if (remaining.length > 0) {
        remaining[0].setAsDefault();
        await this.addressRepository.save(remaining[0]);
      }
    }
  }

  async getUserAddresses(userId: string): Promise<AddressDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserId(userIdVo);
    return addresses.map((a) => Address.toDTO(a));
  }

  async getUserAddressesByType(userId: string, type: AddressType): Promise<AddressDTO[]> {
    const userIdVo = UserId.fromString(userId);
    const addresses = await this.addressRepository.findByUserIdAndType(userIdVo, type);
    return addresses.map((a) => Address.toDTO(a));
  }

  async getDefaultAddress(userId: string): Promise<AddressDTO> {
    const userIdVo = UserId.fromString(userId);
    const address = await this.addressRepository.findDefaultByUserId(userIdVo);
    if (!address) throw new AddressNotFoundError();
    return Address.toDTO(address);
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);

    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userIdVo)) {
      throw new InvalidOperationError('Address does not belong to user');
    }

    const allAddresses = await this.addressRepository.findByUserId(userIdVo);
    for (const existing of allAddresses) {
      if (existing.isDefault && !existing.equals(address)) {
        existing.removeAsDefault();
        await this.addressRepository.save(existing);
      }
    }

    address.setAsDefault();
    await this.addressRepository.save(address);
  }

  async validateAddress(addressData: AddressData): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      const tempAddress = Address.create({
        userId: 'temp-user-id',
        addressData,
        type: AddressType.SHIPPING,
      });

      if (!tempAddress.isValidForShipping()) {
        errors.push('Address is not complete for shipping');
      }
      if (!tempAddress.isValidForBilling()) {
        errors.push('Address is not complete for billing');
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid address format');
    }

    if (!addressData.postalCode && ['US', 'CA', 'UK'].includes(addressData.country)) {
      suggestions.push('Postal code is recommended for this country');
    }
    if (!addressData.state && addressData.country === 'US') {
      suggestions.push('State is required for US addresses');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  async estimateDeliveryDays(addressId: string): Promise<number> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);
    if (!address) throw new AddressNotFoundError();
    return AddressShippingService.estimateDeliveryDays(address);
  }

  async getShippingZone(addressId: string): Promise<string> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);
    if (!address) throw new AddressNotFoundError();
    return AddressShippingService.calculateShippingZone(address).toString();
  }

  async requiresCustomsDeclaration(addressId: string): Promise<boolean> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);
    if (!address) throw new AddressNotFoundError();
    return AddressShippingService.requiresCustomsDeclaration(address);
  }

  async bulkDeleteUserAddresses(userId: string): Promise<number> {
    const userIdVo = UserId.fromString(userId);
    return this.addressRepository.deleteByUserId(userIdVo);
  }
}
