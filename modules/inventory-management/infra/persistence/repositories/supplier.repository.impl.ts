import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { Supplier } from "../../../domain/entities/supplier.entity";
import { SupplierId } from "../../../domain/value-objects/supplier-id.vo";
import { SupplierName } from "../../../domain/value-objects/supplier-name.vo";
import { SupplierContact } from "../../../domain/value-objects/supplier-contact.vo";
import { ISupplierRepository } from "../../../domain/repositories/supplier.repository";

interface SupplierDatabaseRow {
  supplierId: string;
  name: string;
  leadTimeDays: number | null;
  contacts: any;
}

export class SupplierRepositoryImpl extends PrismaRepository<Supplier> implements ISupplierRepository {
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: SupplierDatabaseRow): Supplier {
    const contacts: SupplierContact[] = Array.isArray(row.contacts)
      ? row.contacts.map((c: any) => SupplierContact.create(c))
      : [];

    return Supplier.fromPersistence({
      supplierId: SupplierId.fromString(row.supplierId),
      name: SupplierName.create(row.name),
      leadTimeDays: row.leadTimeDays ?? undefined,
      contacts,
    });
  }

  async save(supplier: Supplier): Promise<void> {
    await (this.prisma as any).supplier.upsert({
      where: { supplierId: supplier.supplierId.getValue() },
      create: {
        supplierId: supplier.supplierId.getValue(),
        name: supplier.name.getValue(),
        leadTimeDays: supplier.leadTimeDays,
        contacts: supplier.contacts.map((c) => c.getValue()) as any,
      },
      update: {
        name: supplier.name.getValue(),
        leadTimeDays: supplier.leadTimeDays,
        contacts: supplier.contacts.map((c) => c.getValue()) as any,
      },
    });

    await this.dispatchEvents(supplier);
  }

  async findById(supplierId: SupplierId): Promise<Supplier | null> {
    const supplier = await (this.prisma as any).supplier.findUnique({
      where: { supplierId: supplierId.getValue() },
    });

    if (!supplier) {
      return null;
    }

    return this.toEntity(supplier as SupplierDatabaseRow);
  }

  async delete(supplierId: SupplierId): Promise<void> {
    await (this.prisma as any).supplier.delete({
      where: { supplierId: supplierId.getValue() },
    });
  }

  async findByName(name: string): Promise<Supplier | null> {
    const supplier = await (this.prisma as any).supplier.findFirst({
      where: { name },
    });

    if (!supplier) {
      return null;
    }

    return this.toEntity(supplier as SupplierDatabaseRow);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    const { limit = 50, offset = 0 } = options || {};

    const [suppliers, total] = await Promise.all([
      (this.prisma as any).supplier.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      }),
      (this.prisma as any).supplier.count(),
    ]);

    return {
      suppliers: suppliers.map((supplier: SupplierDatabaseRow) =>
        this.toEntity(supplier),
      ),
      total,
    };
  }

  async exists(supplierId: SupplierId): Promise<boolean> {
    const count = await (this.prisma as any).supplier.count({
      where: { supplierId: supplierId.getValue() },
    });

    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await (this.prisma as any).supplier.count({
      where: { name },
    });

    return count > 0;
  }
}
