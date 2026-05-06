import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { Supplier } from "../../../domain/entities/supplier.entity";
import { SupplierId } from "../../../domain/value-objects/supplier-id.vo";
import { SupplierName } from "../../../domain/value-objects/supplier-name.vo";
import { SupplierContact } from "../../../domain/value-objects/supplier-contact.vo";
import { ISupplierRepository } from "../../../domain/repositories/supplier.repository";

export class SupplierRepositoryImpl
  extends PrismaRepository<Supplier>
  implements ISupplierRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: Prisma.SupplierGetPayload<object>): Supplier {
    const contacts: SupplierContact[] = Array.isArray(row.contacts)
      ? (row.contacts as Record<string, unknown>[]).map((c) => SupplierContact.create(c))
      : [];

    const fallbackDate = new Date(0);
    return Supplier.fromPersistence({
      supplierId: SupplierId.fromString(row.supplierId),
      name: SupplierName.create(row.name),
      leadTimeDays: row.leadTimeDays ?? undefined,
      contacts,
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    });
  }

  async save(supplier: Supplier): Promise<void> {
    await this.prisma.supplier.upsert({
      where: { supplierId: supplier.supplierId.getValue() },
      create: {
        supplierId: supplier.supplierId.getValue(),
        name: supplier.name.getValue(),
        leadTimeDays: supplier.leadTimeDays,
        contacts: supplier.contacts.map((c) => c.getValue()) as unknown as Prisma.InputJsonValue,
      },
      update: {
        name: supplier.name.getValue(),
        leadTimeDays: supplier.leadTimeDays,
        contacts: supplier.contacts.map((c) => c.getValue()) as unknown as Prisma.InputJsonValue,
      },
    });

    await this.dispatchEvents(supplier);
  }

  async findById(supplierId: SupplierId): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findUnique({
      where: { supplierId: supplierId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(supplierId: SupplierId): Promise<void> {
    await this.prisma.supplier.delete({
      where: { supplierId: supplierId.getValue() },
    });
  }

  async findByName(name: string): Promise<Supplier | null> {
    const row = await this.prisma.supplier.findFirst({
      where: { name },
    });

    return row ? this.toEntity(row) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<Supplier>> {
    const { limit = 50, offset = 0 } = options || {};

    const [rows, total] = await Promise.all([
      this.prisma.supplier.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      this.prisma.supplier.count(),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async exists(supplierId: SupplierId): Promise<boolean> {
    const count = await this.prisma.supplier.count({
      where: { supplierId: supplierId.getValue() },
    });

    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.supplier.count({
      where: { name },
    });

    return count > 0;
  }
}
