import { PrismaClient } from "@prisma/client";
import { IUserProfileRepository } from "../../../domain/repositories/iuser-profile.repository";
import { UserProfile } from "../../../domain/entities/user-profile.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class UserProfileRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(userProfile: UserProfile): Promise<void> {
    const data = userProfile.toDatabaseRow();

    await this.prisma.userProfile.create({
      data: {
        userId: data.user_id,
        defaultAddressId: data.default_address_id,
        defaultPaymentMethodId: data.default_payment_method_id,
        prefs: data.prefs,
        locale: data.locale,
        currency: data.currency,
        stylePreferences: data.style_preferences,
        preferredSizes: data.preferred_sizes,
      },
    });
  }

  async findByUserId(userId: UserId): Promise<UserProfile | null> {
    const profileData = await this.prisma.userProfile.findUnique({
      where: { userId: userId.getValue() },
    });

    if (!profileData) {
      return null;
    }

    return UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData));
  }

  async update(userProfile: UserProfile): Promise<void> {
    const data = userProfile.toDatabaseRow();

    console.log("[DEBUG REPO] Updating profile with data:", {
      userId: data.user_id,
      prefs: data.prefs,
      stylePreferences: data.style_preferences,
      preferredSizes: data.preferred_sizes,
    });

    const result = await this.prisma.userProfile.update({
      where: { userId: data.user_id },
      data: {
        defaultAddressId: data.default_address_id,
        defaultPaymentMethodId: data.default_payment_method_id,
        prefs: data.prefs,
        locale: data.locale,
        currency: data.currency,
        stylePreferences: data.style_preferences,
        preferredSizes: data.preferred_sizes,
      },
    });

    console.log("[DEBUG REPO] Profile updated successfully:", result);
  }

  async delete(userId: UserId): Promise<void> {
    await this.prisma.userProfile.delete({
      where: { userId: userId.getValue() },
    });
  }

  async findByDefaultAddressId(addressId: string): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: { defaultAddressId: addressId },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async findByDefaultPaymentMethodId(
    paymentMethodId: string
  ): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: { defaultPaymentMethodId: paymentMethodId },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async findByLocale(locale: string): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: { locale },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async findByCurrency(currency: string): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: { currency },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async existsByUserId(userId: UserId): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { userId: userId.getValue() },
    });
    return count > 0;
  }

  async findIncompleteProfiles(): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: {
        OR: [{ locale: null }, { currency: null }, { defaultAddressId: null }],
      },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async findProfilesNeedingSetup(): Promise<UserProfile[]> {
    const profiles = await this.prisma.userProfile.findMany({
      where: {
        AND: [{ defaultAddressId: null }, { defaultPaymentMethodId: null }],
      },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async getProfileCompletionStats(): Promise<{
    total: number;
    complete: number;
    incomplete: number;
    averageCompletion: number;
  }> {
    const total = await this.prisma.userProfile.count();

    const complete = await this.prisma.userProfile.count({
      where: {
        AND: [
          { locale: { not: null } },
          { currency: { not: null } },
          { defaultAddressId: { not: null } },
        ],
      },
    });

    const incomplete = total - complete;
    const averageCompletion =
      total > 0 ? Math.round((complete / total) * 100) : 0;

    return {
      total,
      complete,
      incomplete,
      averageCompletion,
    };
  }

  async findByUserIds(userIds: UserId[]): Promise<UserProfile[]> {
    const userIdValues = userIds.map((id) => id.getValue());

    const profiles = await this.prisma.userProfile.findMany({
      where: { userId: { in: userIdValues } },
    });

    return profiles.map((profileData) =>
      UserProfile.fromDatabaseRow(this.mapPrismaToRow(profileData))
    );
  }

  async updateDefaultAddress(
    userId: UserId,
    addressId: string | null
  ): Promise<void> {
    await this.prisma.userProfile.update({
      where: { userId: userId.getValue() },
      data: {
        defaultAddressId: addressId,
      },
    });
  }

  async updateDefaultPaymentMethod(
    userId: UserId,
    paymentMethodId: string | null
  ): Promise<void> {
    await this.prisma.userProfile.update({
      where: { userId: userId.getValue() },
      data: {
        defaultPaymentMethodId: paymentMethodId,
      },
    });
  }

  // Helper method to map Prisma result to domain row format
  private mapPrismaToRow(profileData: any): any {
    return {
      user_id: profileData.userId,
      default_address_id: profileData.defaultAddressId,
      default_payment_method_id: profileData.defaultPaymentMethodId,
      prefs: profileData.prefs,
      locale: profileData.locale,
      currency: profileData.currency,
      style_preferences: profileData.stylePreferences,
      preferred_sizes: profileData.preferredSizes,
    };
  }
}
