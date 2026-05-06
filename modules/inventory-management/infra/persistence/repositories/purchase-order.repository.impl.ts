import { PrismaClient, Prisma, PoStatusEnum } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderItem } from "../../../domain/entities/purchase-order-item.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { SupplierId } from "../../../domain/value-objects/supplier-id.vo";
import { PurchaseOrderStatusVO } from "../../../domain/value-objects/purchase-order-status.vo";
import { IPurchaseOrderRepository } from "../../../domain/repositories/purchase-order.repository";

export class PurchaseOrderRepositoryImpl
  extends PrismaRepository<PurchaseOrder>
  implements IPurchaseOrderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(
    row: Prisma.PurchaseOrderGetPayload<object>,
    itemRows: Array<Prisma.PurchaseOrderItemGetPayload<object>> = [],
  ): PurchaseOrder {
    const items = itemRows.map((ir) =>
      PurchaseOrderItem.fromPersistence({
        poId: PurchaseOrderId.fromString(ir.poId),
        variantId: ir.variantId,
        orderedQty: ir.orderedQty,
        receivedQty: ir.receivedQty,
      }),
    );
    return PurchaseOrder.fromPersistence(
      {
        poId: PurchaseOrderId.fromString(row.poId),
        supplierId: SupplierId.fromString(row.supplierId),
        eta: row.eta ?? undefined,
        status: PurchaseOrderStatusVO.create(row.status),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      items,
    );
  }

  // Persists the PO root and synchronises its items collection in a single
  // transaction. Items present on the aggregate are upserted; items in the
  // DB but absent from the aggregate are deleted (the aggregate is the
  // source of truth for its children). Events dispatch only after the
  // transaction commits.
  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    const poId = purchaseOrder.poId.getValue();

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.upsert({
        where: { poId },
        create: {
          poId,
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

      const desiredVariantIds = purchaseOrder.items.map((i) => i.variantId);

      // Delete items removed from the aggregate.
      await tx.purchaseOrderItem.deleteMany({
        where: {
          poId,
          variantId: { notIn: desiredVariantIds.length > 0 ? desiredVariantIds : ["__none__"] },
        },
      });

      // Upsert each item present on the aggregate.
      for (const item of purchaseOrder.items) {
        await tx.purchaseOrderItem.upsert({
          where: {
            poId_variantId: {
              poId,
              variantId: item.variantId,
            },
          },
          create: {
            poId,
            variantId: item.variantId,
            orderedQty: item.orderedQty,
            receivedQty: item.receivedQty,
          },
          update: {
            orderedQty: item.orderedQty,
            receivedQty: item.receivedQty,
          },
        });
      }
    });

    await this.dispatchEvents(purchaseOrder);
  }

  async findById(poId: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const row = await this.prisma.purchaseOrder.findUnique({
      where: { poId: poId.getValue() },
      include: { items: true },
    });

    return row ? this.toEntity(row, row.items) : null;
  }

  async delete(poId: PurchaseOrderId): Promise<void> {
    await this.prisma.purchaseOrder.delete({
      where: { poId: poId.getValue() },
    });
  }

  async findBySupplier(supplierId: SupplierId): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { supplierId: supplierId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByStatus(status: PurchaseOrderStatusVO): Promise<PurchaseOrder[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { status: status.getValue() as PoStatusEnum },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: PurchaseOrderStatusVO;
    supplierId?: SupplierId;
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
    if (status) where.status = status.getValue() as PoStatusEnum;
    if (supplierId) where.supplierId = supplierId.getValue();

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
