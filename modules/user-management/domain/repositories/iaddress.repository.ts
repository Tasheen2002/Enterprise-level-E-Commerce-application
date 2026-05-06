import { Address } from '../entities/address.entity';
import { AddressId } from '../value-objects/address-id.vo';
import { AddressType } from '../value-objects/address-type.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface IAddressRepository {
  // Core CRUD operations
  save(address: Address): Promise<void>;
  findById(id: AddressId): Promise<Address | null>;
  findByUserId(userId: UserId): Promise<Address[]>;
  delete(id: AddressId): Promise<void>;

  // Query operations
  findByUserIdAndType(userId: UserId, type: AddressType): Promise<Address[]>;
  findDefaultByUserId(userId: UserId): Promise<Address | null>;

  // Aggregation
  countByUserId(userId: UserId): Promise<number>;

  // Cleanup
  deleteByUserId(userId: UserId): Promise<number>;
}
