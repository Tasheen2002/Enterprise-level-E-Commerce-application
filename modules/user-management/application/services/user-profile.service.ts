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
import { AddressId } from "../../domain/value-objects/address-id.vo";
import { PaymentMethodId } from "../../domain/value-objects/payment-method-id.vo";
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
  // `null` means "remove the avatar"; `undefined` means "leave it alone".
  avatarUrl?: string | null;
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

// View model — combines UserProfile + User fields for API responses
export interface UserProfileViewDTO extends UserProfileDTO {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  title: string | null;
  dateOfBirth: string | null;
  residentOf: string | null;
  nationality: string | null;
  createdAt: string;
  updatedAt: string;
}

export class UserProfileService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
  ) { }

  async getUserProfile(userId: string): Promise<UserProfileViewDTO> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.getUserEntity(userIdVo);

    const profile = await this.userProfileRepository.findByUserId(userIdVo);
    if (!profile) {
      // Return an empty default DTO without persisting — profile is created on first update
      const emptyProfile = UserProfile.create({ userId });
      return this.mapToDTO(emptyProfile, user);
    }

    return this.mapToDTO(profile, user);
  }

  async updateUserProfile(
    userId: string,
    params: UpdateUserProfileParams,
  ): Promise<UserProfileViewDTO> {
    const userIdVo = UserId.fromString(userId);
    const user = await this.getUserEntity(userIdVo);

    const hasUserFields =
      params.firstName !== undefined ||
      params.lastName !== undefined ||
      params.phone !== undefined ||
      params.title !== undefined ||
      params.dateOfBirth !== undefined ||
      params.residentOf !== undefined ||
      params.nationality !== undefined;

    if (hasUserFields) {
      if (params.firstName !== undefined) user.updateFirstName(params.firstName);
      if (params.lastName !== undefined) user.updateLastName(params.lastName);
      if (params.phone !== undefined) user.updatePhone(params.phone);
      if (params.title !== undefined) user.updateTitle(params.title);
      if (params.dateOfBirth !== undefined) {
        user.updateDateOfBirth(
          params.dateOfBirth ? new Date(params.dateOfBirth) : null,
        );
      }
      if (params.residentOf !== undefined) user.updateResidentOf(params.residentOf);
      if (params.nationality !== undefined) user.updateNationality(params.nationality);
      await this.userRepository.save(user);
    }

    let profile = await this.userProfileRepository.findByUserId(userIdVo);

    if (!profile) {
      profile = UserProfile.create({
        userId,
        preferences: params.prefs ?? {},
        stylePreferences: params.stylePreferences ?? {},
        preferredSizes: params.preferredSizes ?? {},
        locale: params.locale,
        currency: params.currency,
        defaultAddressId: params.defaultAddressId,
        defaultPaymentMethodId: params.defaultPaymentMethodId,
        avatarUrl: params.avatarUrl ?? undefined,
      });
      await this.userProfileRepository.save(profile);
    } else {
      if (params.defaultAddressId !== undefined) {
        if (params.defaultAddressId) {
          await this.validateAddressBelongsToUser(params.defaultAddressId, userIdVo);
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
      if (params.stylePreferences !== undefined) {
        profile.setStylePreferences(params.stylePreferences);
      }
      if (params.preferredSizes !== undefined) {
        profile.setPreferredSizes(params.preferredSizes);
      }
      if (params.avatarUrl !== undefined) {
        profile.setAvatarUrl(params.avatarUrl);
      }
      await this.userProfileRepository.save(profile);
    }

    return this.mapToDTO(profile, user);
  }

  // --- Private helpers ---

  private async getUserEntity(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  private async validateAddressBelongsToUser(
    addressId: string,
    userId: UserId,
  ): Promise<void> {
    const address = await this.addressRepository.findById(
      AddressId.fromString(addressId),
    );
    if (!address) throw new AddressNotFoundError();
    if (!address.belongsToUser(userId)) {
      throw new InvalidOperationError("Address does not belong to user");
    }
  }

  private async validatePaymentMethodBelongsToUser(
    paymentMethodId: string,
    userId: UserId,
  ): Promise<void> {
    const pm = await this.paymentMethodRepository.findById(
      PaymentMethodId.fromString(paymentMethodId),
    );
    if (!pm) throw new PaymentMethodNotFoundError();
    if (!pm.belongsToUser(userId)) {
      throw new InvalidOperationError("Payment method does not belong to user");
    }
  }

  private mapToDTO(profile: UserProfile, user: User): UserProfileViewDTO {
    return {
      ...UserProfile.toDTO(profile),
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone?.getValue() ?? null,
      title: user.title,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      residentOf: user.residentOf,
      nationality: user.nationality,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
