import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
import { Address, AddressProps } from "../../../domain/entities/address.entity";
import { AddressId } from "../../../domain/value-objects/address-id";
import {
  Address as AddressVO,
  AddressType,
} from "../../../domain/value-objects/address.vo";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class AddressRepository
  extends PrismaRepository<Address>
  implements IAddressRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // Maps a Prisma record to an Address domain entity
  private toDomain(data: any): Address {
    const props: AddressProps = {
      id: AddressId.fromString(data.id),
      userId: UserId.fromString(data.userId),
      addressValue: AddressVO.fromData({
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        company: data.company || undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
        country: data.country,
        phone: data.phone || undefined,
      }),
      type: AddressType.fromString(data.type),
      isDefault: data.isDefault,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Address.fromPersistence(props);
  }

  // Maps an Address domain entity to a Prisma-compatible persistence object
  private toPersistence(address: Address): {
    create: Prisma.UserAddressUncheckedCreateInput;
    update: Prisma.UserAddressUncheckedUpdateInput;
  } {
    const addressData = address.addressValue.getValue();

    const create = {
      id: address.id.getValue(),
      userId: address.userId.getValue(),
      type: address.type.toString(),
      isDefault: address.isDefault,
      firstName: addressData.firstName || null,
      lastName: addressData.lastName || null,
      company: addressData.company || null,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2 || null,
      city: addressData.city,
      state: addressData.state || null,
      postalCode: addressData.postalCode || null,
      country: addressData.country,
      phone: addressData.phone || null,
      createdAt: address.createdAt,
    };

    const { id, userId, createdAt, ...update } = create;

    return { create, update };
  }

  async save(address: Address): Promise<void> {
    const data = this.toPersistence(address);

    await this.prisma.userAddress.upsert({
      where: { id: address.id.getValue() },
      create: data.create,
      update: data.update,
    });

    await this.dispatchEvents(address);
  }

  async findById(id: AddressId): Promise<Address | null> {
    const addressData = await this.prisma.userAddress.findUnique({
      where: { id: id.getValue() },
    });

    if (!addressData) {
      return null;
    }

    return this.toDomain(addressData);
  }

  async findByUserId(userId: UserId): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default addresses first
        { createdAt: "desc" },
      ],
    });

    return addresses.map((data) => this.toDomain(data));
  }

  async delete(id: AddressId): Promise<void> {
    await this.prisma.userAddress.delete({
      where: { id: id.getValue() },
    });
  }

  async findByUserIdAndType(
    userId: UserId,
    type: AddressType,
  ): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        userId: userId.getValue(),
        type: type.toString(),
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return addresses.map((data) => this.toDomain(data));
  }

  async findDefaultByUserId(userId: UserId): Promise<Address | null> {
    const addressData = await this.prisma.userAddress.findFirst({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
    });

    if (!addressData) {
      return null;
    }

    return this.toDomain(addressData);
  }

  async setAsDefault(addressId: AddressId, userId: UserId): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // First, remove default flag from all addresses for this user
      await tx.userAddress.updateMany({
        where: { userId: userId.getValue() },
        data: { isDefault: false },
      });

      // Then set the specified address as default
      await tx.userAddress.update({
        where: { id: addressId.getValue() },
        data: { isDefault: true },
      });
    });
  }

  async removeDefault(userId: UserId): Promise<void> {
    await this.prisma.userAddress.updateMany({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.prisma.userAddress.count({
      where: { userId: userId.getValue() },
    });
  }

  async findConflictingAddress(
    userId: UserId,
    address: Address,
  ): Promise<Address | null> {
    const data = this.toPersistence(address);

    const conflictingAddress = await this.prisma.userAddress.findFirst({
      where: {
        userId: userId.getValue(),
        addressLine1: data.create.addressLine1,
        city: data.create.city,
        country: data.create.country,
        postalCode: data.create.postalCode,
        NOT: {
          id: data.create.id,
        },
      },
    });

    if (!conflictingAddress) {
      return null;
    }

    return this.toDomain(conflictingAddress);
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.userAddress.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }
}
