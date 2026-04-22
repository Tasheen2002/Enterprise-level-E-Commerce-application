import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { Stock } from "../../../domain/entities/stock.entity";
import { StockLevel } from "../../../domain/value-objects/stock-level.vo";
import { IStockRepository } from "../../../domain/repositories/stock.repository";

export class StockRepositoryImpl
  extends PrismaRepository<Stock>
  implements IStockRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: {
    variantId: string;
    locationId: string;
    onHand: number;
    reserved: number;
    lowStockThreshold: number | null;
    safetyStock: number | null;
  }): Stock {
    return Stock.fromPersistence({
      variantId: row.variantId,
      locationId: row.locationId,
      stockLevel: StockLevel.create(
        row.onHand,
        row.reserved,
        row.lowStockThreshold,
        row.safetyStock,
      ),
    });
  }

  async save(stock: Stock): Promise<void> {
    const stockLevel = stock.stockLevel;

    await this.prisma.inventoryStock.upsert({
      where: {
        variantId_locationId: {
          variantId: stock.variantId,
          locationId: stock.locationId,
        },
      },
      create: {
        variantId: stock.variantId,
        locationId: stock.locationId,
        onHand: stockLevel.onHand,
        reserved: stockLevel.reserved,
        lowStockThreshold: stockLevel.lowStockThreshold,
        safetyStock: stockLevel.safetyStock,
      },
      update: {
        onHand: stockLevel.onHand,
        reserved: stockLevel.reserved,
        lowStockThreshold: stockLevel.lowStockThreshold,
        safetyStock: stockLevel.safetyStock,
      },
    });

    await this.dispatchEvents(stock);
  }

  async findByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<Stock | null> {
    const row = await this.prisma.inventoryStock.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(variantId: string, locationId: string): Promise<void> {
    await this.prisma.inventoryStock.delete({
      where: { variantId_locationId: { variantId, locationId } },
    });
  }

  async findByVariant(variantId: string): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { variantId },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByLocation(locationId: string): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { locationId },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: "low_stock" | "out_of_stock" | "in_stock";
    locationId?: string;
    sortBy?: "available" | "onHand" | "location" | "product";
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResult<Stock>> {
    const {
      limit = 50,
      offset = 0,
      search,
      status,
      locationId,
      sortBy = "product",
      sortOrder = "asc",
    } = options || {};

    const where: Prisma.InventoryStockWhereInput = {};

    if (search) {
      where.variant = {
        OR: [
          { sku: { contains: search, mode: "insensitive" } },
          { product: { title: { contains: search, mode: "insensitive" } } },
          { product: { brand: { contains: search, mode: "insensitive" } } },
        ],
      };
    }

    if (locationId) {
      where.locationId = locationId;
    }

    let orderBy: Prisma.InventoryStockOrderByWithRelationInput = { variantId: "asc" };
    if (sortBy === "onHand") {
      orderBy = { onHand: sortOrder };
    } else if (sortBy === "location") {
      orderBy = { locationId: sortOrder };
    } else if (sortBy === "product") {
      orderBy = { variant: { product: { title: sortOrder } } };
    }

    const shouldFetchAll = status || sortBy === "available";

    const [stocks, total] = await Promise.all([
      this.prisma.inventoryStock.findMany({
        take: shouldFetchAll ? undefined : limit,
        skip: shouldFetchAll ? undefined : offset,
        where,
        orderBy,
        include: {
          location: true,
          variant: {
            include: {
              product: {
                include: {
                  media: {
                    include: {
                      asset: {
                        select: {
                          id: true,
                          storageKey: true,
                          mime: true,
                          width: true,
                          height: true,
                          altText: true,
                          focalX: true,
                          focalY: true,
                          renditions: true,
                          version: true,
                          createdAt: true,
                        },
                      },
                    },
                    orderBy: { position: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.inventoryStock.count({ where }),
    ]);

    const variantIds = stocks.map((s) => s.variantId);
    const now = new Date();

    const activeReservations = await this.prisma.reservation.groupBy({
      by: ["variantId"],
      where: {
        variantId: { in: variantIds },
        expiresAt: { gt: now },
      },
      _sum: { qty: true },
    });

    const reservationMap = new Map<string, number>();
    activeReservations.forEach((r) => {
      if (r.variantId && r._sum.qty) {
        reservationMap.set(r.variantId, r._sum.qty);
      }
    });

    let stockEntities = stocks.map((stock) => {
      const reservedInCart = reservationMap.get(stock.variantId) ?? 0;
      return this.toEntity({ ...stock, reserved: stock.reserved + reservedInCart });
    });

    if (status) {
      stockEntities = stockEntities.filter((stock) => {
        const stockLevel = stock.stockLevel;
        if (status === "out_of_stock") return stockLevel.isOutOfStock();
        if (status === "low_stock") return stockLevel.isLowStock() && !stockLevel.isOutOfStock();
        if (status === "in_stock") return !stockLevel.isLowStock() && !stockLevel.isOutOfStock();
        return true;
      });
    }

    if (sortBy === "available") {
      stockEntities.sort((a, b) => {
        const diff = a.stockLevel.available - b.stockLevel.available;
        return sortOrder === "asc" ? diff : -diff;
      });
    }

    const finalTotal = shouldFetchAll ? stockEntities.length : total;
    const items = shouldFetchAll
      ? stockEntities.slice(offset, offset + limit)
      : stockEntities;

    return { items, total: finalTotal, limit, offset, hasMore: offset + items.length < finalTotal };
  }

  async findLowStockItems(): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { lowStockThreshold: { not: null } },
    });

    return rows
      .filter((r) => r.lowStockThreshold !== null && r.onHand <= r.lowStockThreshold)
      .map((r) => this.toEntity(r));
  }

  async findOutOfStockItems(): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { onHand: { lte: 0 } },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async getTotalAvailableStock(variantId: string): Promise<number> {
    const result = await this.prisma.inventoryStock.aggregate({
      where: { variantId },
      _sum: { onHand: true, reserved: true },
    });

    return (result._sum.onHand ?? 0) - (result._sum.reserved ?? 0);
  }

  async exists(variantId: string, locationId: string): Promise<boolean> {
    const count = await this.prisma.inventoryStock.count({
      where: { variantId, locationId },
    });

    return count > 0;
  }

  async getStats(): Promise<{
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  }> {
    const [totalStats, allStocks] = await Promise.all([
      this.prisma.inventoryStock.aggregate({ _sum: { onHand: true } }),
      this.prisma.inventoryStock.findMany(),
    ]);

    const lowStockCount = allStocks.filter(
      (s) => s.lowStockThreshold !== null && s.onHand <= s.lowStockThreshold,
    ).length;

    const outOfStockCount = allStocks.filter((s) => s.onHand <= s.reserved).length;

    return {
      totalItems: totalStats._sum.onHand ?? 0,
      lowStockCount,
      outOfStockCount,
      totalValue: 0,
    };
  }
}
