import { Address } from "../entities/address.entity";
import { AddressType } from "../value-objects/address.vo";
import { UserId } from "../value-objects/user-id.vo";

export interface IAddressRepository {
  // Core CRUD operations
  save(address: Address): Promise<void>;
  findById(id: string): Promise<Address | null>;
  findByUserId(userId: UserId): Promise<Address[]>;
  update(address: Address): Promise<void>;
  delete(id: string): Promise<void>;

  // Query operations
  findByUserIdAndType(userId: UserId, type: AddressType): Promise<Address[]>;
  findDefaultByUserId(userId: UserId): Promise<Address | null>;
  findByCountry(
    country: string,
    limit?: number,
    offset?: number
  ): Promise<Address[]>;
  findByCity(city: string, limit?: number, offset?: number): Promise<Address[]>;

  // Business operations
  existsById(id: string): Promise<boolean>;
  setAsDefault(addressId: string, userId: UserId): Promise<void>;
  removeDefault(userId: UserId): Promise<void>;
  countByUserId(userId: UserId): Promise<number>;

  // Validation operations
  findConflictingAddress(
    userId: UserId,
    address: Address
  ): Promise<Address | null>;
  findSimilarAddresses(
    address: Address,
    threshold?: number
  ): Promise<Address[]>;

  // Analytics operations
  getAddressStatsByCountry(): Promise<
    Array<{
      country: string;
      count: number;
    }>
  >;

  getUserAddressStats(userId: UserId): Promise<{
    total: number;
    byType: Record<string, number>;
    hasDefault: boolean;
  }>;

  // Batch operations
  findByIds(ids: string[]): Promise<Address[]>;
  deleteByUserId(userId: UserId): Promise<number>;
  findByUserIds(userIds: UserId[]): Promise<Address[]>;
}
