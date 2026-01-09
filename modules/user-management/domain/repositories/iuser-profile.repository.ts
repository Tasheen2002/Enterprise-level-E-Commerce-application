import { UserProfile } from "../entities/user-profile.entity";
import { UserId } from "../value-objects/user-id.vo";

export interface IUserProfileRepository {
  // Core CRUD operations
  save(userProfile: UserProfile): Promise<void>;
  findByUserId(userId: UserId): Promise<UserProfile | null>;
  update(userProfile: UserProfile): Promise<void>;
  delete(userId: UserId): Promise<void>;

  // Query operations
  findByDefaultAddressId(addressId: string): Promise<UserProfile[]>;
  findByDefaultPaymentMethodId(paymentMethodId: string): Promise<UserProfile[]>;
  findByLocale(locale: string): Promise<UserProfile[]>;
  findByCurrency(currency: string): Promise<UserProfile[]>;

  // Business operations
  existsByUserId(userId: UserId): Promise<boolean>;
  findIncompleteProfiles(): Promise<UserProfile[]>;
  findProfilesNeedingSetup(): Promise<UserProfile[]>;

  // Analytics operations
  getProfileCompletionStats(): Promise<{
    total: number;
    complete: number;
    incomplete: number;
    averageCompletion: number;
  }>;

  // Batch operations
  findByUserIds(userIds: UserId[]): Promise<UserProfile[]>;
  updateDefaultAddress(userId: UserId, addressId: string | null): Promise<void>;
  updateDefaultPaymentMethod(
    userId: UserId,
    paymentMethodId: string | null
  ): Promise<void>;
}
