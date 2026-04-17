import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { Stock, StockProps } from "../../../domain/entities/stock.entity";
import { StockLevel } from "../../../domain/value-objects/stock-level.vo";
import { IStockRepository } from "../../../domain/repositories/stock.repository";

interface StockDatabaseRow {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number | null;
  safetyStock: number | null;
  variant?: any;
  location?: any;
}

export class StockRepositoryImpl extends PrismaRepository<Stock> implements IStockRepository {
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: StockDatabaseRow): Stock {
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

    await (this.prisma as any).inventoryStock.upsert({
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
    const stock = await (this.prisma as any).inventoryStock.findUnique({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
    });

    if (!stock) {
      return null;
    }

    return this.toEntity(stock);
  }

  async delete(variantId: string, locationId: string): Promise<void> {
    await (this.prisma as any).inventoryStock.delete({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
    });
  }

  async findByVariant(variantId: string): Promise<Stock[]> {
    const stocks = await (this.prisma as any).inventoryStock.findMany({
      where: { variantId },
    });

    return stocks.map((stock: StockDatabaseRow) => this.toEntity(stock));
  }

  async findByLocation(locationId: string): Promise<Stock[]> {
    const stocks = await (this.prisma as any).inventoryStock.findMany({
      where: { locationId },
    });

    return stocks.map((stock: StockDatabaseRow) => this.toEntity(stock));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: "low_stock" | "out_of_stock" | "in_stock";
    locationId?: string;
    sortBy?: "available" | "onHand" | "location" | "product";
    sortOrder?: "asc" | "desc";
  }): Promise<{ stocks: Stock[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      search,
      status,
      locationId,
      sortBy = "product",
      sortOrder = "asc",
    } = options || {};

    const where: any = {};

    if (search) {
      where.variant = {
        OR: [
          {
            sku: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            product: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            product: {
              brand: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    }

    if (locationId) {
      where.locationId = locationId;
    }

    let orderBy: any = { variantId: "asc" };
    if (sortBy === "onHand") {
      orderBy = { onHand: sortOrder };
    } else if (sortBy === "location") {
      orderBy = { locationId: sortOrder };
    } else if (sortBy === "product") {
      orderBy = { variant: { product: { title: sortOrder } } };
    }

    const shouldFetchAll = status || sortBy === "available";

    const [stocks, total] = await Promise.all([
      (this.prisma as any).inventoryStock.findMany({
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
                    orderBy: {
                      position: "asc",
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      }),
      (this.prisma as any).inventoryStock.count({ where }),
    ]);

    const variantIds = stocks.map((s: any) => s.variantId);
    const now = new Date();

    const activeReservations = await (this.prisma as any).reservation.groupBy({
      by: ["variantId"],
      where: {
        variantId: { in: variantIds },
        expiresAt: { gt: now },
      },
      _sum: {
        qty: true,
      },
    });

    const reservationMap = new Map<string, number>();
    activeReservations.forEach((r: any) => {
      if (r.variantId && r._sum.qty) {
        reservationMap.set(r.variantId, r._sum.qty);
      }
    });

    let stockEntities = stocks.map((stock: StockDatabaseRow) => {
      const reservedInCart = reservationMap.get(stock.variantId) || 0;

      const modifiedRow = {
        ...stock,
        reserved: stock.reserved + reservedInCart,
      };

      return this.toEntity(modifiedRow);
    });

    if (status) {
      stockEntities = stockEntities.filter((stock: Stock) => {
        const stockLevel = stock.stockLevel;
        if (status === "out_of_stock") {
          return stockLevel.isOutOfStock();
        } else if (status === "low_stock") {
          return stockLevel.isLowStock() && !stockLevel.isOutOfStock();
        } else if (status === "in_stock") {
          return !stockLevel.isLowStock() && !stockLevel.isOutOfStock();
        }
        return true;
      });
    }

    if (sortBy === "available") {
      stockEntities.sort((a: Stock, b: Stock) => {
        const availableA = a.stockLevel.available;
        const availableB = b.stockLevel.available;
        return sortOrder === "asc"
          ? availableA - availableB
          : availableB - availableA;
      });
    }

    const finalTotal = stockEntities.length;
    const paginatedStocks = shouldFetchAll
      ? stockEntities.slice(offset, offset + limit)
      : stockEntities;

    return {
      stocks: paginatedStocks,
      total: shouldFetchAll ? finalTotal : total,
    };
  }

  async findLowStockItems(): Promise<Stock[]> {
    const stocks = await (this.prisma as any).inventoryStock.findMany({
      where: {
        lowStockThreshold: { not: null },
      },
    });

    return stocks
      .filter((s: StockDatabaseRow) =>
        s.lowStockThreshold !== null && s.onHand <= s.lowStockThreshold,
      )
      .map((s: StockDatabaseRow) => this.toEntity(s));
  }

  async findOutOfStockItems(): Promise<Stock[]> {
    const stocks = await (this.prisma as any).inventoryStock.findMany({
      where: {
        onHand: { lte: 0 },
      },
    });

    return stocks.map((s: StockDatabaseRow) => this.toEntity(s));
  }

  async getTotalAvailableStock(variantId: string): Promise<number> {
    const result = await (this.prisma as any).inventoryStock.aggregate({
      where: { variantId },
      _sum: {
        onHand: true,
        reserved: true,
      },
    });

    const totalOnHand = result._sum.onHand || 0;
    const totalReserved = result._sum.reserved || 0;

    return totalOnHand - totalReserved;
  }

  async exists(variantId: string, locationId: string): Promise<boolean> {
    const count = await (this.prisma as any).inventoryStock.count({
      where: {
        variantId,
        locationId,
      },
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
      (this.prisma as any).inventoryStock.aggregate({
        _sum: { onHand: true },
      }),
      (this.prisma as any).inventoryStock.findMany(),
    ]);

    const lowStockCount = allStocks.filter(
      (s: StockDatabaseRow) =>
        s.lowStockThreshold !== null && s.onHand <= s.lowStockThreshold,
    ).length;

    const outOfStockCount = allStocks.filter(
      (s: StockDatabaseRow) => s.onHand <= s.reserved,
    ).length;

    return {
      totalItems: totalStats._sum.onHand || 0,
      lowStockCount,
      outOfStockCount,
      totalValue: 0,
    };
  }
}
