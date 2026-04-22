import { PrismaClient, Prisma, PoStatusEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { SupplierId } from "../../../domain/value-objects/supplier-id.vo";
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
} from "../../../domain/value-objects/purchase-order-status.vo";
import { IPurchaseOrderRepository } from "../../../domain/repositories/purchase-order.repository";

export class PurchaseOrderRepositoryImpl
  extends PrismaRepository<PurchaseOrder>
  implements IPurchaseOrderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: {
    poId: string;
    supplierId: string;
    eta: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): PurchaseOrder {
    return PurchaseOrder.fromPersistence({
      poId: PurchaseOrderId.fromString(row.poId),
      supplierId: SupplierId.fromString(row.supplierId),
      eta: row.eta ?? undefined,
      status: PurchaseOrderStatusVO.create(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    await this.prisma.purchaseOrder.upsert({
      where: { poId: purchaseOrder.poId.getValue() },
      create: {
        poId: purchaseOrder.poId.getValue(),
        supplierId: purchaseOrder.supplierId.getValue(),
        eta: purchaseOrder.eta,
        status: purchaseOrder.status.getValue() as PoStatusEnum,
        createdAt: purchaseOrder.createdAt,
        updatedAt: purchaseOrder.updatedAt,
      },
      update: {
        eta: purchaseOrder.eta,
        status: purchaseOrder.status.getValue() as PoStatusEnum,
        updatedAt: purchaseOrder.updatedAt,
      },
    });

    await this.dispatchEvents(purchaseOrder);
  }

  async findById(poId: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const row = await this.prisma.purchaseOrder.findUnique({
      where: { poId: poId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(poId: PurchaseOrderId): Promise<void> {
    await this.prisma.purchaseOrder.delete({
      where: { poId: poId.getValue() },
    });
  }

  async findBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { status: status as PoStatusEnum },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    sortBy?: "createdAt" | "updatedAt" | "eta";
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResult<PurchaseOrder>> {
    const {
      limit = 50,
      offset = 0,
      status,
      supplierId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (status) where.status = status as PoStatusEnum;
    if (supplierId) where.supplierId = supplierId;

    const [rows, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findOverduePurchaseOrders(): Promise<PurchaseOrder[]> {
    const now = new Date();
    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        eta: { lt: now },
        status: { in: ["sent", "part_received"] },
      },
      orderBy: { eta: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findPendingReceival(): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { status: { in: ["sent", "part_received"] } },
      orderBy: { eta: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async exists(poId: PurchaseOrderId): Promise<boolean> {
    const count = await this.prisma.purchaseOrder.count({
      where: { poId: poId.getValue() },
    });

    return count > 0;
  }
}
