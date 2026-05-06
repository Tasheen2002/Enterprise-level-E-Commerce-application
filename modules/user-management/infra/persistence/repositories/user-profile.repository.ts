import { PrismaClient, Prisma, type UserProfile as PrismaUserProfile } from "@prisma/client";
import { IUserProfileRepository } from "../../../domain/repositories/iuser-profile.repository";
import {
  UserProfile,
  UserProfileProps,
  UserPreferences,
  StylePreferences,
  PreferredSizes,
} from "../../../domain/entities/user-profile.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { AddressId } from "../../../domain/value-objects/address-id.vo";
import { PaymentMethodId } from "../../../domain/value-objects/payment-method-id.vo";
import { Currency } from "../../../domain/value-objects";
import { Locale } from "../../../domain/value-objects/locale.vo";

// UserProfile is not an aggregate root — it emits no domain events.
// No PrismaRepository base or dispatchEvents needed; plain Prisma access is correct.
export class UserProfileRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: PrismaUserProfile): UserProfile {
    const props: UserProfileProps = {
      userId: UserId.fromString(row.userId),
      defaultAddressId: row.defaultAddressId ? AddressId.fromString(row.defaultAddressId) : null,
      defaultPaymentMethodId: row.defaultPaymentMethodId ? PaymentMethodId.fromString(row.defaultPaymentMethodId) : null,
      preferences: (row.prefs ?? {}) as UserPreferences,
      locale: row.locale ? Locale.fromString(row.locale) : null,
      currency: row.currency ? Currency.fromString(row.currency) : null,
      stylePreferences: (row.stylePreferences ?? {}) as StylePreferences,
      preferredSizes: (row.preferredSizes ?? {}) as PreferredSizes,
    };

    return UserProfile.fromPersistence(props);
  }

  private toPersistence(userProfile: UserProfile): {
    create: Prisma.UserProfileUncheckedCreateInput;
    update: Prisma.UserProfileUncheckedUpdateInput;
  } {
    const create = {
      userId: userProfile.userId.getValue(),
      defaultAddressId: userProfile.defaultAddressId?.getValue() ?? null,
      defaultPaymentMethodId: userProfile.defaultPaymentMethodId?.getValue() ?? null,
      prefs: userProfile.preferences as Prisma.InputJsonValue,
      locale: userProfile.locale?.getValue() ?? null,
      currency: userProfile.currency?.getValue() ?? null,
      stylePreferences: userProfile.stylePreferences as Prisma.InputJsonValue,
      preferredSizes: userProfile.preferredSizes as Prisma.InputJsonValue,
    };

    const { userId, ...update } = create;

    return { create, update };
  }

  async save(userProfile: UserProfile): Promise<void> {
    const data = this.toPersistence(userProfile);

    await this.prisma.userProfile.upsert({
      where: { userId: userProfile.userId.getValue() },
      create: data.create,
      update: data.update,
    });

  }

  async findByUserId(userId: UserId): Promise<UserProfile | null> {
    const profileData = await this.prisma.userProfile.findUnique({
      where: { userId: userId.getValue() },
    });

    if (!profileData) {
      return null;
    }

    return this.toDomain(profileData);
  }

  async delete(userId: UserId): Promise<void> {
    await this.prisma.userProfile.delete({
      where: { userId: userId.getValue() },
    });
  }
}
