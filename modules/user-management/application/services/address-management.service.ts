import { IAddressRepository } from '../../domain/repositories/iaddress.repository';
import { IUserProfileRepository } from '../../domain/repositories/iuser-profile.repository';
import { Address, AddressDTO } from '../../domain/entities/address.entity';
import { AddressId } from '../../domain/value-objects/address-id.vo';
import { Address as AddressVO } from '../../domain/value-objects/address.vo';
import { AddressType } from '../../domain/value-objects/address-type.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { ShippingZone } from '../../domain/value-objects/shipping-zone.vo';
import {
  AddressShippingService,
} from '../../domain/services/address-shipping.service';
import {
  AddressNotFoundError,
  InvalidOperationError,
} from '../../domain/errors/user-management.errors';
import { PaginatedResult } from '../../../../packages/core/src/domain/interfaces/paginated-result.interface';

export interface ListUserAddressesOptions {
  page?: number;
  limit?: number;
}

type AddressInput = Parameters<typeof AddressVO.create>[0];

interface AddAddressParams {
  userId: string;
  addressData: AddressInput;
  type: AddressType;
  isDefault?: boolean;
}

interface UpdateAddressParams {
  addressId: string;
  userId: string;
  addressData?: Partial<AddressInput>;
  type?: AddressType;
  isDefault?: boolean;
}

export class AddressManagementService {
  constructor(
    private readonly addressRepository: IAddressRepository,
    private readonly userProfileRepository: IUserProfileRepository,
  ) { }

  async addAddress(params: AddAddressParams): Promise<AddressDTO> {
    const userId = UserId.fromString(params.userId);
    const existingAddresses = await this.addressRepository.findByUserId(userId);

    // Duplicate check using domain equals on the address VO — done BEFORE
    // creating the entity so we don't emit a stray AddressCreatedEvent.
    const newAddressValue = AddressVO.create(params.addressData);
    const isDuplicate = existingAddresses.some((a) =>
      a.addressValue.equals(newAddressValue),
    );
    if (isDuplicate) {
      throw new InvalidOperationError('A similar address already exists for this user');
    }

    const shouldBeDefault = params.isDefault || existingAddresses.length === 0;

    // De-default others FIRST so the new address can be created already-default,
    // emitting only AddressCreatedEvent (no extra AddressSetAsDefaultEvent).
    if (shouldBeDefault) {
      await this.clearOtherDefaults(userId);
    }

    const address = Address.create({
      userId: params.userId,
      addressData: params.addressData,
      type: params.type,
      isDefault: shouldBeDefault,
    });

    await this.addressRepository.save(address);
    if (shouldBeDefault) {
      await this.syncUserProfileDefault(userId, address.id);
    }

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
      // Merge partial PATCH input with current values so the entity always
      // receives a complete AddressInput. Required fields (addressLine1, city,
      // country) keep their existing values when not provided in the patch.
      const current = address.addressValue.getValue();
      const patch = params.addressData;
      address.updateAddress({
        firstName: patch.firstName ?? current.firstName,
        lastName: patch.lastName ?? current.lastName,
        company: patch.company ?? current.company,
        addressLine1: patch.addressLine1 ?? current.addressLine1,
        addressLine2: patch.addressLine2 ?? current.addressLine2,
        city: patch.city ?? current.city,
        state: patch.state ?? current.state,
        postalCode: patch.postalCode ?? current.postalCode,
        country: patch.country ?? current.country,
        phone: patch.phone ?? current.phone,
      });
    }
    if (params.type) {
      address.changeType(params.type);
    }

    if (params.isDefault === true) {
      await this.clearOtherDefaults(userId, address.id);
      address.setAsDefault();
    } else if (params.isDefault === false) {
      address.removeAsDefault();
    }

    await this.addressRepository.save(address);
    if (params.isDefault === true) {
      await this.syncUserProfileDefault(userId, address.id);
    }

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
        await this.syncUserProfileDefault(userIdVo, remaining[0].id);
      } else {
        await this.clearUserProfileDefault(userIdVo);
      }
    }
  }

  // PERF: address books are user-scoped and typically small (<50). Repo
  // returns all rows; we slice in memory. Switch to repo-side pagination if
  // address counts ever grow large.
  async getUserAddresses(
    userId: string,
    options: ListUserAddressesOptions = {},
  ): Promise<PaginatedResult<AddressDTO>> {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const userIdVo = UserId.fromString(userId);
    const allAddresses = await this.addressRepository.findByUserId(userIdVo);
    const total = allAddresses.length;
    const items = allAddresses.slice(offset, offset + limit).map((a) => Address.toDTO(a));

    return { items, total, limit, offset, hasMore: offset + items.length < total };
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

    await this.clearOtherDefaults(userIdVo, address.id);
    address.setAsDefault();
    await this.addressRepository.save(address);
    await this.syncUserProfileDefault(userIdVo, address.id);
  }

  async validateAddress(addressData: AddressInput): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!addressData.addressLine1?.trim()) {
      errors.push('Address line 1 is required');
    }
    if (!addressData.city?.trim()) {
      errors.push('City is required');
    }
    if (!addressData.country?.trim()) {
      errors.push('Country is required');
    }

    if (!addressData.postalCode && ['US', 'CA', 'GB'].includes(addressData.country)) {
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

  async getShippingZone(addressId: string): Promise<ShippingZone> {
    const addressIdVo = AddressId.fromString(addressId);
    const address = await this.addressRepository.findById(addressIdVo);
    if (!address) throw new AddressNotFoundError();
    return AddressShippingService.calculateShippingZone(address);
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

  /**
   * Removes the `default` flag from any other address the user has, except
   * the one being promoted (if provided). Persists each de-defaulted address.
   */
  private async clearOtherDefaults(userId: UserId, exceptAddressId?: AddressId): Promise<void> {
    const allAddresses = await this.addressRepository.findByUserId(userId);
    for (const existing of allAddresses) {
      if (!existing.isDefault) continue;
      if (exceptAddressId && existing.id.equals(exceptAddressId)) continue;
      existing.removeAsDefault();
      await this.addressRepository.save(existing);
    }
  }

  private async syncUserProfileDefault(userId: UserId, addressId: AddressId): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (profile) {
      profile.setDefaultAddress(addressId.getValue());
      await this.userProfileRepository.save(profile);
    }
  }

  private async clearUserProfileDefault(userId: UserId): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (profile) {
      profile.removeDefaultAddress();
      await this.userProfileRepository.save(profile);
    }
  }
}
