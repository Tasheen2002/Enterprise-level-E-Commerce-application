import {
  PrismaClient,
  Prisma,
  UserStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import { PrismaRepository } from '../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base';
import { IEventBus } from '../../../../../packages/core/src/domain/events/domain-event';
import {
  IUserRepository,
  FindAllWithFiltersOptions,
  UserListItem,
} from '../../../domain/repositories/iuser.repository';
import { PaginatedResult } from '../../../../../packages/core/src/domain/interfaces/paginated-result.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { Email } from '../../../domain/value-objects/email.vo';
import { Phone } from '../../../domain/value-objects/phone.vo';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { InvalidOperationError } from '../../../domain/errors/user-management.errors';

export class UserRepository
  extends PrismaRepository<User>
  implements IUserRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(user: User): Promise<void> {
    const data = this.toPersistence(user);

    await (this.prisma.user as any).upsert({
      where: { id: user.id.getValue() },
      create: data.create,
      update: data.update,
    });

    await this.dispatchEvents(user);
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: id.getValue() },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    });

    return row ? this.toDomain(row) : null;
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { phone } });
    return row ? this.toDomain(row) : null;
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

  async findByIds(ids: UserId[]): Promise<User[]> {
    const userIds = ids.map((id) => id.getValue());
    const rows = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAllWithFilters(
    options: FindAllWithFiltersOptions
  ): Promise<PaginatedResult<UserListItem>> {
    const { search, role, status, emailVerified, page, limit, sortBy, sortOrder } = options;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = this.mapRoleToPrisma(role);
    if (status) where.status = this.mapStatusToPrisma(status);
    if (emailVerified !== undefined) where.emailVerified = emailVerified;

    const offset = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      (this.prisma.user as any).findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
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

    const items: UserListItem[] = rows.map((r: any) => ({
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
    }));

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  // ==========================================
  // Persistence mapping
  // ==========================================

  private toDomain(row: any): User {
    return User.fromPersistence({
      id: UserId.fromString(row.id),
      email: Email.create(row.email),
      passwordHash: row.passwordHash || '',
      phone: row.phone ? Phone.create(row.phone) : null,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      title: row.title ?? null,
      dateOfBirth: row.dateOfBirth ?? null,
      residentOf: row.residentOf ?? null,
      nationality: row.nationality ?? null,
      role: this.mapRoleFromPrisma(row.role),
      status: this.mapStatusFromPrisma(row.status),
      emailVerified: row.emailVerified,
      phoneVerified: row.phoneVerified,
      isGuest: row.isGuest,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPersistence(user: User): {
    create: Prisma.UserUncheckedCreateInput;
    update: Prisma.UserUncheckedUpdateInput;
  } {
    return {
      create: {
        id: user.id.getValue(),
        email: user.email.getValue(),
        passwordHash: user.passwordHash || null,
        phone: user.phone?.getValue() || null,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        dateOfBirth: user.dateOfBirth,
        residentOf: user.residentOf,
        nationality: user.nationality,
        role: this.mapRoleToPrisma(user.role),
        status: this.mapStatusToPrisma(user.status),
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        email: user.email.getValue(),
        passwordHash: user.passwordHash || null,
        phone: user.phone?.getValue() || null,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        dateOfBirth: user.dateOfBirth,
        residentOf: user.residentOf,
        nationality: user.nationality,
        role: this.mapRoleToPrisma(user.role),
        status: this.mapStatusToPrisma(user.status),
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isGuest: user.isGuest,
        updatedAt: user.updatedAt,
      },
    };
  }

  // ==========================================
  // Enum mappers
  // ==========================================

  private mapStatusToPrisma(status: UserStatus): PrismaUserStatus {
    switch (status) {
      case UserStatus.ACTIVE: return PrismaUserStatus.active;
      case UserStatus.INACTIVE: return PrismaUserStatus.inactive;
      case UserStatus.BLOCKED: return PrismaUserStatus.blocked;
      default: throw new InvalidOperationError(`Unknown user status: ${status}`);
    }
  }

  private mapStatusFromPrisma(status: PrismaUserStatus): UserStatus {
    switch (status) {
      case PrismaUserStatus.active: return UserStatus.ACTIVE;
      case PrismaUserStatus.inactive: return UserStatus.INACTIVE;
      case PrismaUserStatus.blocked: return UserStatus.BLOCKED;
      default: throw new InvalidOperationError(`Unknown Prisma user status: ${status}`);
    }
  }

  private mapRoleToPrisma(role: UserRole): PrismaUserRole {
    switch (role) {
      case UserRole.GUEST: return PrismaUserRole.GUEST;
      case UserRole.CUSTOMER: return PrismaUserRole.CUSTOMER;
      case UserRole.ADMIN: return PrismaUserRole.ADMIN;
      case UserRole.INVENTORY_STAFF: return PrismaUserRole.INVENTORY_STAFF;
      case UserRole.CUSTOMER_SERVICE: return PrismaUserRole.CUSTOMER_SERVICE;
      case UserRole.ANALYST: return PrismaUserRole.ANALYST;
      case UserRole.VENDOR: return PrismaUserRole.VENDOR;
      default: throw new InvalidOperationError(`Unknown user role: ${role}`);
    }
  }

  private mapRoleFromPrisma(role: PrismaUserRole): UserRole {
    switch (role) {
      case PrismaUserRole.GUEST: return UserRole.GUEST;
      case PrismaUserRole.CUSTOMER: return UserRole.CUSTOMER;
      case PrismaUserRole.ADMIN: return UserRole.ADMIN;
      case PrismaUserRole.INVENTORY_STAFF: return UserRole.INVENTORY_STAFF;
      case PrismaUserRole.CUSTOMER_SERVICE: return UserRole.CUSTOMER_SERVICE;
      case PrismaUserRole.ANALYST: return UserRole.ANALYST;
      case PrismaUserRole.VENDOR: return UserRole.VENDOR;
      default: throw new InvalidOperationError(`Unknown Prisma user role: ${role}`);
    }
  }
}
