import { PrismaClient } from "@prisma/client";
import { PurchaseOrder } from "../../../domain/entities/purchase-order.entity";
import { PurchaseOrderId } from "../../../domain/value-objects/purchase-order-id.vo";
import { SupplierId } from "../../../domain/value-objects/supplier-id.vo";
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
} from "../../../domain/value-objects/purchase-order-status.vo";
import { IPurchaseOrderRepository } from "../../../domain/repositories/purchase-order.repository";

interface PurchaseOrderDatabaseRow {
  poId: string;
  supplierId: string;
  eta: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseOrderRepositoryImpl implements IPurchaseOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}
  private toEntity(row: PurchaseOrderDatabaseRow): PurchaseOrder {
    return PurchaseOrder.reconstitute({
      poId: PurchaseOrderId.create(row.poId),
      supplierId: SupplierId.create(row.supplierId),
      eta: row.eta || undefined,
      status: PurchaseOrderStatusVO.create(row.status),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    await (this.prisma as any).purchaseOrder.upsert({
      where: { poId: purchaseOrder.getPoId().getValue() },
      create: {
        poId: purchaseOrder.getPoId().getValue(),
        supplierId: purchaseOrder.getSupplierId().getValue(),
        eta: purchaseOrder.getEta(),
        status: purchaseOrder.getStatus().getValue(),
        createdAt: purchaseOrder.getCreatedAt(),
        updatedAt: purchaseOrder.getUpdatedAt(),
      },
      update: {
        eta: purchaseOrder.getEta(),
        status: purchaseOrder.getStatus().getValue(),
        updatedAt: purchaseOrder.getUpdatedAt(),
      },
    });
  }

  async findById(poId: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const purchaseOrder = await (this.prisma as any).purchaseOrder.findUnique({
      where: { poId: poId.getValue() },
    });

    if (!purchaseOrder) {
      return null;
    }

    return this.toEntity(purchaseOrder as PurchaseOrderDatabaseRow);
  }

  async delete(poId: PurchaseOrderId): Promise<void> {
    await (this.prisma as any).purchaseOrder.delete({
      where: { poId: poId.getValue() },
    });
  }

  async findBySupplier(supplierId: SupplierId): Promise<PurchaseOrder[]> {
    const purchaseOrders = await (this.prisma as any).purchaseOrder.findMany({
      where: { supplierId: supplierId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return purchaseOrders.map((po: PurchaseOrderDatabaseRow) =>
      this.toEntity(po),
    );
  }

  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const purchaseOrders = await (this.prisma as any).purchaseOrder.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });

    return purchaseOrders.map((po: PurchaseOrderDatabaseRow) =>
      this.toEntity(po),
    );
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    sortBy?: "createdAt" | "updatedAt" | "eta";
    sortOrder?: "asc" | "desc";
  }): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      status,
      supplierId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options || {};

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (supplierId) whereClause.supplierId = supplierId;

    const [purchaseOrders, total] = await Promise.all([
      (this.prisma as any).purchaseOrder.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      (this.prisma as any).purchaseOrder.count({ where: whereClause }),
    ]);

    return {
      purchaseOrders: purchaseOrders.map((po: PurchaseOrderDatabaseRow) =>
        this.toEntity(po),
      ),
      total,
    };
  }

  async findOverduePurchaseOrders(): Promise<PurchaseOrder[]> {
    const now = new Date();
    const purchaseOrders = await (this.prisma as any).purchaseOrder.findMany({
      where: {
        eta: {
          lt: now,
        },
        status: {
          in: ["sent", "part_received"],
        },
      },
      orderBy: { eta: "asc" },
    });

    return purchaseOrders.map((po: PurchaseOrderDatabaseRow) =>
      this.toEntity(po),
    );
  }

  async findPendingReceival(): Promise<PurchaseOrder[]> {
    const purchaseOrders = await (this.prisma as any).purchaseOrder.findMany({
      where: {
        status: {
          in: ["sent", "part_received"],
        },
      },
      orderBy: { eta: "asc" },
    });

    return purchaseOrders.map((po: PurchaseOrderDatabaseRow) =>
      this.toEntity(po),
    );
  }

  async exists(poId: PurchaseOrderId): Promise<boolean> {
    const count = await (this.prisma as any).purchaseOrder.count({
      where: { poId: poId.getValue() },
    });

    return count > 0;
  }
}
