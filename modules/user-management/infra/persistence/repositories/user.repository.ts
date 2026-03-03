import {
  PrismaClient,
  UserStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
} from "@prisma/client";
import {
  IUserRepository,
  FindAllWithFiltersOptions,
  UserListItemDTO,
} from "../../../domain/repositories/iuser.repository";
import {
  User,
  UserStatus,
  UserRole,
} from "../../../domain/entities/user.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { Email } from "../../../domain/value-objects/email.vo";
import { InvalidOperationError } from "../../../domain/errors/user-management.errors";

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toUserRow(r: any) {
    return {
      user_id: r.id as string,
      email: r.email as string,
      password_hash: r.passwordHash as string | null,
      phone: r.phone as string | null,
      first_name: (r.firstName ?? null) as string | null,
      last_name: (r.lastName ?? null) as string | null,
      title: (r.title ?? null) as string | null,
      date_of_birth: (r.dateOfBirth ?? null) as Date | null,
      resident_of: (r.residentOf ?? null) as string | null,
      nationality: (r.nationality ?? null) as string | null,
      role: this.mapRoleFromPrisma(r.role),
      status: this.mapStatusFromPrisma(r.status),
      email_verified: r.emailVerified as boolean,
      phone_verified: r.phoneVerified as boolean,
      is_guest: r.isGuest as boolean,
      created_at: r.createdAt as Date,
      updated_at: r.updatedAt as Date,
    };
  }

  async save(user: User): Promise<void> {
    const data = user.toDatabaseRow();

    await (this.prisma.user as any).create({
      data: {
        id: data.user_id,
        email: data.email,
        passwordHash: data.password_hash,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        title: data.title,
        dateOfBirth: data.date_of_birth,
        residentOf: data.resident_of,
        nationality: data.nationality,
        status: this.mapStatusToPrisma(data.status),
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        isGuest: data.is_guest,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id: id.getValue() },
    });

    if (!userData) return null;
    return User.fromDatabaseRow(this.toUserRow(userData));
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    });

    if (!userData) return null;
    return User.fromDatabaseRow(this.toUserRow(userData));
  }

  async update(user: User): Promise<void> {
    const data = user.toDatabaseRow();

    await (this.prisma.user as any).update({
      where: { id: data.user_id },
      data: {
        email: data.email,
        passwordHash: data.password_hash,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        title: data.title,
        dateOfBirth: data.date_of_birth,
        residentOf: data.resident_of,
        nationality: data.nationality,
        status: this.mapStatusToPrisma(data.status),
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        isGuest: data.is_guest,
        updatedAt: data.updated_at,
      },
    });
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const userData = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (!userData) return null;
    return User.fromDatabaseRow(this.toUserRow(userData));
  }

  async findActiveUsers(limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { status: PrismaUserStatus.active, isGuest: false },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => User.fromDatabaseRow(this.toUserRow(u)));
  }

  async findGuestUsers(limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { isGuest: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => User.fromDatabaseRow(this.toUserRow(u)));
  }

  async findUnverifiedUsers(limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { emailVerified: false, isGuest: false },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => User.fromDatabaseRow(this.toUserRow(u)));
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.getValue() },
    });
    return count > 0;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { phone } });
    return count > 0;
  }

  async countActiveUsers(): Promise<number> {
    return await this.prisma.user.count({
      where: { status: PrismaUserStatus.active, isGuest: false },
    });
  }

  async countGuestUsers(): Promise<number> {
    return await this.prisma.user.count({ where: { isGuest: true } });
  }

  async findByIds(ids: UserId[]): Promise<User[]> {
    const userIds = ids.map((id) => id.getValue());
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    return users.map((u) => User.fromDatabaseRow(this.toUserRow(u)));
  }

  async deleteInactiveSince(date: Date): Promise<number> {
    const result = await this.prisma.user.deleteMany({
      where: { status: PrismaUserStatus.inactive, updatedAt: { lt: date } },
    });
    return result.count;
  }

  async findAllWithFilters(
    options: FindAllWithFiltersOptions,
  ): Promise<{ users: UserListItemDTO[]; total: number }> {
    const {
      search,
      role,
      status,
      emailVerified,
      page,
      limit,
      sortBy,
      sortOrder,
    } = options;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) where.role = this.mapRoleToPrisma(role);
    if (status) where.status = this.mapStatusToPrisma(status);
    if (emailVerified !== undefined) where.emailVerified = emailVerified;

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      (this.prisma.user as any).findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          isGuest: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: rows.map(
        (r: any): UserListItemDTO => ({
          userId: r.id,
          email: r.email,
          phone: r.phone ?? null,
          firstName: r.firstName ?? null,
          lastName: r.lastName ?? null,
          role: this.mapRoleFromPrisma(r.role),
          status: this.mapStatusFromPrisma(r.status),
          emailVerified: r.emailVerified,
          phoneVerified: r.phoneVerified,
          isGuest: r.isGuest,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }),
      ),
      total,
    };
  }

  // Enum mappers
  private mapStatusToPrisma(status: UserStatus): PrismaUserStatus {
    switch (status) {
      case UserStatus.ACTIVE:
        return PrismaUserStatus.active;
      case UserStatus.INACTIVE:
        return PrismaUserStatus.inactive;
      case UserStatus.BLOCKED:
        return PrismaUserStatus.blocked;
      default:
        throw new InvalidOperationError(`Unknown user status: ${status}`);
    }
  }

  private mapStatusFromPrisma(status: PrismaUserStatus): UserStatus {
    switch (status) {
      case PrismaUserStatus.active:
        return UserStatus.ACTIVE;
      case PrismaUserStatus.inactive:
        return UserStatus.INACTIVE;
      case PrismaUserStatus.blocked:
        return UserStatus.BLOCKED;
      default:
        throw new InvalidOperationError(`Unknown Prisma user status: ${status}`);
    }
  }

  private mapRoleToPrisma(role: UserRole): PrismaUserRole {
    switch (role) {
      case UserRole.GUEST:
        return PrismaUserRole.GUEST;
      case UserRole.CUSTOMER:
        return PrismaUserRole.CUSTOMER;
      case UserRole.ADMIN:
        return PrismaUserRole.ADMIN;
      case UserRole.INVENTORY_STAFF:
        return PrismaUserRole.INVENTORY_STAFF;
      case UserRole.CUSTOMER_SERVICE:
        return PrismaUserRole.CUSTOMER_SERVICE;
      case UserRole.ANALYST:
        return PrismaUserRole.ANALYST;
      case UserRole.VENDOR:
        return PrismaUserRole.VENDOR;
      default:
        throw new InvalidOperationError(`Unknown user role: ${role}`);
    }
  }

  private mapRoleFromPrisma(role: PrismaUserRole): UserRole {
    switch (role) {
      case PrismaUserRole.GUEST:
        return UserRole.GUEST;
      case PrismaUserRole.CUSTOMER:
        return UserRole.CUSTOMER;
      case PrismaUserRole.ADMIN:
        return UserRole.ADMIN;
      case PrismaUserRole.INVENTORY_STAFF:
        return UserRole.INVENTORY_STAFF;
      case PrismaUserRole.CUSTOMER_SERVICE:
        return UserRole.CUSTOMER_SERVICE;
      case PrismaUserRole.ANALYST:
        return UserRole.ANALYST;
      case PrismaUserRole.VENDOR:
        return UserRole.VENDOR;
      default:
        throw new InvalidOperationError(`Unknown Prisma user role: ${role}`);
    }
  }
}
