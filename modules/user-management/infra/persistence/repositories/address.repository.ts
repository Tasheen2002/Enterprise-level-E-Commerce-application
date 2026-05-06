import { PrismaClient, Prisma, type UserAddress as PrismaUserAddress } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
import { Address, AddressProps } from "../../../domain/entities/address.entity";
import { AddressId } from "../../../domain/value-objects/address-id.vo";
import { Address as AddressVO } from "../../../domain/value-objects/address.vo";
import { AddressType } from "../../../domain/value-objects/address-type.vo";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class AddressRepository
  extends PrismaRepository<Address>
  implements IAddressRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
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
    const row = await this.prisma.userAddress.findUnique({
      where: { id: id.getValue() },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<Address[]> {
    const rows = await this.prisma.userAddress.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default addresses first
        { createdAt: "desc" },
      ],
    });

    return rows.map((row) => this.toDomain(row));
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
    const rows = await this.prisma.userAddress.findMany({
      where: {
        userId: userId.getValue(),
        type: type.getValue(),
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findDefaultByUserId(userId: UserId): Promise<Address | null> {
    const row = await this.prisma.userAddress.findFirst({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return this.prisma.userAddress.count({
      where: { userId: userId.getValue() },
    });
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.userAddress.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  // --- Persistence mapping ---

  private toDomain(row: PrismaUserAddress): Address {
    const props: AddressProps = {
      id: AddressId.fromString(row.id),
      userId: UserId.fromString(row.userId),
      addressValue: AddressVO.fromPersistence({
        firstName: row.firstName ?? undefined,
        lastName: row.lastName ?? undefined,
        company: row.company ?? undefined,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2 ?? undefined,
        city: row.city,
        state: row.state ?? undefined,
        postalCode: row.postalCode ?? undefined,
        country: row.country,
        phone: row.phone ?? undefined,
      }),
      type: AddressType.fromString(row.type),
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return Address.fromPersistence(props);
  }

  private toPersistence(address: Address): {
    create: Prisma.UserAddressUncheckedCreateInput;
    update: Prisma.UserAddressUncheckedUpdateInput;
  } {
    const data = address.addressValue.getValue();

    const create = {
      id: address.id.getValue(),
      userId: address.userId.getValue(),
      type: address.type.getValue(),
      isDefault: address.isDefault,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      company: data.company ?? null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      country: data.country,
      phone: data.phone ?? null,
      createdAt: address.createdAt,
    };

    const { id, userId, createdAt, ...update } = create;

    return { create, update };
  }
}
