import { IUserRepository } from "../../domain/repositories/iuser.repository";
import { IUserProfileRepository } from "../../domain/repositories/iuser-profile.repository";
import { IAddressRepository } from "../../domain/repositories/iaddress.repository";
import { IPaymentMethodRepository } from "../../domain/repositories/ipayment-method.repository";
import {
  UserProfile,
  UserProfileDTO,
  UserPreferences,
  StylePreferences,
  PreferredSizes,
} from "../../domain/entities/user-profile.entity";

import { User } from "../../domain/entities/user.entity";
import { AddressId } from "../../domain/value-objects/address-id";
import { PaymentMethodId } from "../../domain/value-objects/payment-method-id";
import { UserId } from "../../domain/value-objects/user-id.vo";
import {
  UserNotFoundError,
  AddressNotFoundError,
  PaymentMethodNotFoundError,
  InvalidOperationError,
} from "../../domain/errors/user-management.errors";

interface UpdateUserProfileParams {
  defaultAddressId?: string;
  defaultPaymentMethodId?: string;
  prefs?: UserPreferences;
  locale?: string;
  currency?: string;
  stylePreferences?: StylePreferences;
  preferredSizes?: PreferredSizes;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  dateOfBirth?: string;
  residentOf?: string;
  nationality?: string;
}

interface UserProfileWithDetails {
  profile: UserProfileDTO;
  defaultAddress?: {
    id: string;
    type: string;
    addressLine1: string;
    city: string;
    country: string;
    isDefault: boolean;
  };
  defaultPaymentMethod?: {
    id: string;
    type: string;
    brand?: string;
    last4?: string;
    isDefault: boolean;
  };
}

export class UserProfileService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileDTO> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);
    if (!user) throw new UserNotFoundError();

    const profile = await this.userProfileRepository.findByUserId(userIdVo);
    if (!profile) {
      // Return an empty default DTO without persisting — profile is created on first update
      const emptyProfile = UserProfile.create({ userId });
      return this.mapToDTO(emptyProfile, user);
    }

    return this.mapToDTO(profile, user);
  }

  async getUserProfileWithDetails(
    userId: string,
  ): Promise<UserProfileWithDetails> {
    const profileDTO = await this.getUserProfile(userId);
    const result: UserProfileWithDetails = { profile: profileDTO };

    if (profileDTO.defaultAddressId) {
      const address = await this.addressRepository.findById(
        AddressId.fromString(profileDTO.defaultAddressId),
      );
      if (address) {
        const data = address.addressValue.getValue();
        result.defaultAddress = {
          id: address.id.getValue(),
          type: address.type.toString(),
          addressLine1: data.addressLine1,
          city: data.city,
          country: data.country,
          isDefault: address.isDefault,
        };
      }
    }

    if (profileDTO.defaultPaymentMethodId) {
      const pm = await this.paymentMethodRepository.findById(
        PaymentMethodId.fromString(profileDTO.defaultPaymentMethodId),
      );
      if (pm) {
        result.defaultPaymentMethod = {
          id: pm.id.getValue(),
          type: pm.type.toString(),
          brand: pm.brand || undefined,
          last4: pm.last4 || undefined,
          isDefault: pm.isDefault,
        };
      }
    }

    return result;
  }

  async updateUserProfile(
    userId: string,
    params: UpdateUserProfileParams,
  ): Promise<UserProfileDTO> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVo);
    if (!user) throw new UserNotFoundError();

    const hasUserFields =
      params.firstName !== undefined ||
      params.lastName !== undefined ||
      params.phone !== undefined ||
      params.title !== undefined ||
      params.dateOfBirth !== undefined ||
      params.residentOf !== undefined ||
      params.nationality !== undefined;

    if (hasUserFields) {
      if (params.firstName !== undefined)
        user.updateFirstName(params.firstName);
      if (params.lastName !== undefined) user.updateLastName(params.lastName);
      if (params.phone !== undefined) user.updatePhone(params.phone);
      if (params.title !== undefined) user.updateTitle(params.title);
      if (params.dateOfBirth !== undefined)
        user.updateDateOfBirth(
          params.dateOfBirth ? new Date(params.dateOfBirth) : null,
        );
      if (params.residentOf !== undefined)
        user.updateResidentOf(params.residentOf);
      if (params.nationality !== undefined)
        user.updateNationality(params.nationality);
      await this.userRepository.save(user);
    }

    let profile = await this.userProfileRepository.findByUserId(userIdVo);

    if (!profile) {
      profile = UserProfile.create({
        userId,
        preferences: params.prefs || {},
        stylePreferences: params.stylePreferences || {},
        preferredSizes: params.preferredSizes || {},
        locale: params.locale,
        currency: params.currency,
        defaultAddressId: params.defaultAddressId,
        defaultPaymentMethodId: params.defaultPaymentMethodId,
      });
      await this.userProfileRepository.save(profile);
    } else {
      if (params.defaultAddressId !== undefined) {
        if (params.defaultAddressId) {
          await this.validateAddressBelongsToUser(
            params.defaultAddressId,
            userIdVo,
          );
          profile.setDefaultAddress(params.defaultAddressId);
        } else {
          profile.removeDefaultAddress();
        }
      }
      if (params.defaultPaymentMethodId !== undefined) {
        if (params.defaultPaymentMethodId) {
          await this.validatePaymentMethodBelongsToUser(
            params.defaultPaymentMethodId,
            userIdVo,
          );
          profile.setDefaultPaymentMethod(params.defaultPaymentMethodId);
        } else {
          profile.removeDefaultPaymentMethod();
        }
      }
      if (params.prefs !== undefined) profile.setPreferences(params.prefs);
      if (params.locale) profile.setLocale(params.locale);
      if (params.currency) profile.setCurrency(params.currency);
      if (params.stylePreferences !== undefined)
        profile.setStylePreferences(params.stylePreferences);
      if (params.preferredSizes !== undefined)
        profile.setPreferredSizes(params.preferredSizes);
      await this.userProfileRepository.save(profile);
    }

    return this.mapToDTO(profile, user);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    await this.validateAddressBelongsToUser(addressId, userIdVo);

    let profile = await this.userProfileRepository.findByUserId(userIdVo);
    if (!profile) {
      profile = UserProfile.create({ userId, defaultAddressId: addressId });
      await this.userProfileRepository.save(profile);
    } else {
      profile.setDefaultAddress(addressId);
      await this.userProfileRepository.save(profile);
    }
  }

  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    await this.validatePaymentMethodBelongsToUser(paymentMethodId, userIdVo);

    let profile = await this.userProfileRepository.findByUserId(userIdVo);
    if (!profile) {
      profile = UserProfile.create({
        userId,
        defaultPaymentMethodId: paymentMethodId,
      });
      await this.userProfileRepository.save(profile);
    } else {
      profile.setDefaultPaymentMethod(paymentMethodId);
      await this.userProfileRepository.save(profile);
    }
  }

  async updatePreferences(
    userId: string,
    prefs: UserPreferences,
  ): Promise<UserProfileDTO> {
    return this.updateUserProfile(userId, { prefs });
  }

  async updateStylePreferences(
    userId: string,
    stylePreferences: StylePreferences,
  ): Promise<UserProfileDTO> {
    return this.updateUserProfile(userId, { stylePreferences });
  }

  async updatePreferredSizes(
    userId: string,
    preferredSizes: PreferredSizes,
  ): Promise<UserProfileDTO> {
    return this.updateUserProfile(userId, { preferredSizes });
  }

  async updateLocaleAndCurrency(
    userId: string,
    locale?: string,
    currency?: string,
  ): Promise<UserProfileDTO> {
    return this.updateUserProfile(userId, { locale, currency });
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const userIdVo = UserId.fromString(userId);
    const profile = await this.userProfileRepository.findByUserId(userIdVo);
    if (profile) await this.userProfileRepository.delete(userIdVo);
  }

  async getUserPreference(userId: string, key: string): Promise<unknown> {
    const profile = await this.getUserProfile(userId);
    return profile.preferences[key] ?? null;
  }

  async setUserPreference(
    userId: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);
    const updatedPrefs = { ...profile.preferences, [key]: value };
    await this.updateUserProfile(userId, { prefs: updatedPrefs });
  }

  async removeUserPreference(userId: string, key: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    const updatedPrefs = { ...profile.preferences };
    delete updatedPrefs[key];
    await this.updateUserProfile(userId, { prefs: updatedPrefs });
  }

  async bulkUpdatePreferences(
    userId: string,
    preferences: UserPreferences,
  ): Promise<UserProfileDTO> {
    const profile = await this.getUserProfile(userId);
    const updatedPrefs = { ...profile.preferences, ...preferences };
    return this.updateUserProfile(userId, { prefs: updatedPrefs });
  }

  private async validateAddressBelongsToUser(
    addressId: string,
    userId: UserId,
  ): Promise<void> {
    const address = await this.addressRepository.findById(
      AddressId.fromString(addressId),
    );
    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userId))
      throw new InvalidOperationError("Address does not belong to user");
  }

  private async validatePaymentMethodBelongsToUser(
    paymentMethodId: string,
    userId: UserId,
  ): Promise<void> {
    const pm = await this.paymentMethodRepository.findById(
      PaymentMethodId.fromString(paymentMethodId),
    );
    if (!pm) throw new PaymentMethodNotFoundError();
    if (!pm.belongsToUser(userId))
      throw new InvalidOperationError("Payment method does not belong to user");
  }

  private mapToDTO(profile: UserProfile, user: User): UserProfileDTO {
    return {
      ...UserProfile.toDTO(profile),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone?.getValue() ?? null,
      title: user.title,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      residentOf: user.residentOf,
      nationality: user.nationality,
    };
  }
}
