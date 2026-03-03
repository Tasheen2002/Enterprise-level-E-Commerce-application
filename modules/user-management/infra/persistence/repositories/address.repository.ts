import { PrismaClient } from "@prisma/client";
import { IAddressRepository } from "../../../domain/repositories/iaddress.repository";
import { Address } from "../../../domain/entities/address.entity";
import { AddressType } from "../../../domain/value-objects/address.vo";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(address: Address): Promise<void> {
    const data = address.toDatabaseRow();

    await this.prisma.userAddress.create({
      data: {
        id: data.address_id,
        userId: data.user_id,
        type: data.type,
        isDefault: data.is_default,
        firstName: data.first_name,
        lastName: data.last_name,
        company: data.company,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        phone: data.phone,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  }

  async findById(id: string): Promise<Address | null> {
    const addressData = await this.prisma.userAddress.findUnique({
      where: { id },
    });

    if (!addressData) {
      return null;
    }

    return Address.fromDatabaseRow({
      address_id: addressData.id,
      user_id: addressData.userId,
      type: addressData.type,
      is_default: addressData.isDefault,
      first_name: addressData.firstName,
      last_name: addressData.lastName,
      company: addressData.company,
      address_line_1: addressData.addressLine1,
      address_line_2: addressData.addressLine2,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone,
      created_at: addressData.createdAt,
      updated_at: addressData.updatedAt,
    });
  }

  async findByUserId(userId: UserId): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default addresses first
        { createdAt: "desc" },
      ],
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }

  async update(address: Address): Promise<void> {
    const data = address.toDatabaseRow();

    await this.prisma.userAddress.update({
      where: { id: data.address_id },
      data: {
        type: data.type,
        isDefault: data.is_default,
        firstName: data.first_name,
        lastName: data.last_name,
        company: data.company,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        phone: data.phone,
        updatedAt: data.updated_at,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userAddress.delete({
      where: { id },
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

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
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

    return Address.fromDatabaseRow({
      address_id: addressData.id,
      user_id: addressData.userId,
      type: addressData.type,
      is_default: addressData.isDefault,
      first_name: addressData.firstName,
      last_name: addressData.lastName,
      company: addressData.company,
      address_line_1: addressData.addressLine1,
      address_line_2: addressData.addressLine2,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone,
      created_at: addressData.createdAt,
      updated_at: addressData.updatedAt,
    });
  }

  async findByCountry(
    country: string,
    limit?: number,
    offset?: number,
  ): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { country: country.toUpperCase() },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }

  async findByCity(
    city: string,
    limit?: number,
    offset?: number,
  ): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        city: {
          contains: city,
          mode: "insensitive",
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.userAddress.count({
      where: { id },
    });
    return count > 0;
  }

  async setAsDefault(addressId: string, userId: UserId): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // First, remove default flag from all addresses for this user
      await tx.userAddress.updateMany({
        where: { userId: userId.getValue() },
        data: { isDefault: false },
      });

      // Then set the specified address as default
      await tx.userAddress.update({
        where: { id: addressId },
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
    const addressData = address.toDatabaseRow();

    const conflictingAddress = await this.prisma.userAddress.findFirst({
      where: {
        userId: userId.getValue(),
        addressLine1: addressData.address_line_1,
        city: addressData.city,
        country: addressData.country,
        postalCode: addressData.postal_code,
        NOT: {
          id: addressData.address_id, // Exclude the current address if updating
        },
      },
    });

    if (!conflictingAddress) {
      return null;
    }

    return Address.fromDatabaseRow({
      address_id: conflictingAddress.id,
      user_id: conflictingAddress.userId,
      type: conflictingAddress.type,
      is_default: conflictingAddress.isDefault,
      first_name: conflictingAddress.firstName,
      last_name: conflictingAddress.lastName,
      company: conflictingAddress.company,
      address_line_1: conflictingAddress.addressLine1,
      address_line_2: conflictingAddress.addressLine2,
      city: conflictingAddress.city,
      state: conflictingAddress.state,
      postal_code: conflictingAddress.postalCode,
      country: conflictingAddress.country,
      phone: conflictingAddress.phone,
      created_at: conflictingAddress.createdAt,
      updated_at: conflictingAddress.updatedAt,
    });
  }

  async findSimilarAddresses(
    address: Address,
    threshold: number = 0.8,
  ): Promise<Address[]> {
    const addressData = address.toDatabaseRow();

    const addresses = await this.prisma.userAddress.findMany({
      where: {
        OR: [
          {
            addressLine1: {
              contains: addressData.address_line_1.split(" ")[0], // First word
              mode: "insensitive",
            },
          },
          {
            AND: [{ city: addressData.city }, { country: addressData.country }],
          },
        ],
        NOT: {
          id: addressData.address_id,
        },
      },
      take: 10, // Limit results
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }

  async getAddressStatsByCountry(): Promise<
    Array<{ country: string; count: number }>
  > {
    const stats = await this.prisma.userAddress.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return stats.map((stat) => ({
      country: stat.country,
      count: stat._count.id,
    }));
  }

  async getUserAddressStats(userId: UserId): Promise<{
    total: number;
    byType: Record<string, number>;
    hasDefault: boolean;
  }> {
    const [total, byType, defaultAddress] = await Promise.all([
      this.prisma.userAddress.count({
        where: { userId: userId.getValue() },
      }),
      this.prisma.userAddress.groupBy({
        by: ["type"],
        where: { userId: userId.getValue() },
        _count: {
          id: true,
        },
      }),
      this.prisma.userAddress.findFirst({
        where: {
          userId: userId.getValue(),
          isDefault: true,
        },
        select: { id: true },
      }),
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach((stat) => {
      typeStats[stat.type] = stat._count.id;
    });

    return {
      total,
      byType: typeStats,
      hasDefault: !!defaultAddress,
    };
  }

  async findByIds(ids: string[]): Promise<Address[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.userAddress.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  async findByUserIds(userIds: UserId[]): Promise<Address[]> {
    const userIdValues = userIds.map((id) => id.getValue());

    const addresses = await this.prisma.userAddress.findMany({
      where: { userId: { in: userIdValues } },
      orderBy: [
        { userId: "asc" },
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return addresses.map((addressData) =>
      Address.fromDatabaseRow({
        address_id: addressData.id,
        user_id: addressData.userId,
        type: addressData.type,
        is_default: addressData.isDefault,
        first_name: addressData.firstName,
        last_name: addressData.lastName,
        company: addressData.company,
        address_line_1: addressData.addressLine1,
        address_line_2: addressData.addressLine2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: addressData.country,
        phone: addressData.phone,
        created_at: addressData.createdAt,
        updated_at: addressData.updatedAt,
      }),
    );
  }
}
