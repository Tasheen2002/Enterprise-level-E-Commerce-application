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

  // Maps a Prisma record to a UserProfile domain entity
  private toDomain(data: any): UserProfile {
    const props: UserProfileProps = {
      userId: UserId.fromString(data.userId),
      defaultAddressId: data.defaultAddressId,
      defaultPaymentMethodId: data.defaultPaymentMethodId,
      preferences: (data.prefs || {}) as UserPreferences,
      locale: data.locale ? new Locale(data.locale) : null,
      currency: data.currency ? new Currency(data.currency) : null,
      stylePreferences: (data.stylePreferences || {}) as StylePreferences,
      preferredSizes: (data.preferredSizes || {}) as PreferredSizes,
    };

    return UserProfile.reconstitute(props);
  }

  // Maps a UserProfile domain entity to a Prisma-compatible persistence object
  private toPersistence(userProfile: UserProfile): {
    create: Prisma.UserProfileUncheckedCreateInput;
    update: Prisma.UserProfileUncheckedUpdateInput;
  } {
    const create = {
      userId: userProfile.getUserId().getValue(),
      defaultAddressId: userProfile.getDefaultAddressId(),
      defaultPaymentMethodId: userProfile.getDefaultPaymentMethodId(),
      prefs: userProfile.getPreferences(),
      locale: userProfile.getLocale()?.getValue() || null,
      currency: userProfile.getCurrency()?.getValue() || null,
      stylePreferences: userProfile.getStylePreferences(),
      preferredSizes: userProfile.getPreferredSizes(),
    };

    const { userId, ...update } = create;

    return { create, update };
  }

  async save(userProfile: UserProfile): Promise<void> {
    const data = this.toPersistence(userProfile);

    await this.prisma.userProfile.upsert({
      where: { userId: userProfile.getUserId().getValue() },
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
