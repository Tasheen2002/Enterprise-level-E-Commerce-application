import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IUserProfileRepository } from "../../../domain/repositories/iuser-profile.repository";
import {
  UserProfile,
  UserProfileProps,
  UserPreferences,
  StylePreferences,
  PreferredSizes,
} from "../../../domain/entities/user-profile.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";
import { Locale } from "../../../domain/value-objects/locale.vo";

export class UserProfileRepository
  extends PrismaRepository<UserProfile>
  implements IUserProfileRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toDomain(data: any): UserProfile {
    const props: UserProfileProps = {
      userId: UserId.fromString(data.userId),
      defaultAddressId: data.defaultAddressId,
      defaultPaymentMethodId: data.defaultPaymentMethodId,
      preferences: (data.prefs || {}) as UserPreferences,
      locale: data.locale ? Locale.fromString(data.locale) : null,
      currency: data.currency ? Currency.fromString(data.currency) : null,
      stylePreferences: (data.stylePreferences || {}) as StylePreferences,
      preferredSizes: (data.preferredSizes || {}) as PreferredSizes,
    };

    return UserProfile.fromPersistence(props);
  }

  private toPersistence(userProfile: UserProfile): {
    create: Prisma.UserProfileUncheckedCreateInput;
    update: Prisma.UserProfileUncheckedUpdateInput;
  } {
    const create = {
      userId: userProfile.userId.getValue(),
      defaultAddressId: userProfile.defaultAddressId,
      defaultPaymentMethodId: userProfile.defaultPaymentMethodId,
      prefs: userProfile.preferences,
      locale: userProfile.locale?.getValue() || null,
      currency: userProfile.currency?.getValue() || null,
      stylePreferences: userProfile.stylePreferences,
      preferredSizes: userProfile.preferredSizes,
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

    await this.dispatchEvents(userProfile);
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
