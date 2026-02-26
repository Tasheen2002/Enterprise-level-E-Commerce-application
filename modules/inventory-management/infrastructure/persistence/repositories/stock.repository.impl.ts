import { PrismaClient } from "@prisma/client";
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

export class StockRepositoryImpl implements IStockRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: StockDatabaseRow): Stock {
    return Stock.reconstitute({
      variantId: row.variantId,
      locationId: row.locationId,
      stockLevel: StockLevel.create(
        row.onHand,
        row.reserved,
        row.lowStockThreshold,
        row.safetyStock,
      ),
      variant: row.variant,
      location: row.location,
    });
  }

  async save(stock: Stock): Promise<void> {
    const stockLevel = stock.getStockLevel();

    await (this.prisma as any).inventoryStock.upsert({
      where: {
        variantId_locationId: {
          variantId: stock.getVariantId(),
          locationId: stock.getLocationId(),
        },
      },
      create: {
        variantId: stock.getVariantId(),
        locationId: stock.getLocationId(),
        onHand: stockLevel.getOnHand(),
        reserved: stockLevel.getReserved(),
        lowStockThreshold: stockLevel.getLowStockThreshold(),
        safetyStock: stockLevel.getSafetyStock(),
      },
      update: {
        onHand: stockLevel.getOnHand(),
        reserved: stockLevel.getReserved(),
        lowStockThreshold: stockLevel.getLowStockThreshold(),
        safetyStock: stockLevel.getSafetyStock(),
      },
    });
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
        const stockLevel = stock.getStockLevel();
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
        const availableA = a.getStockLevel().getAvailable();
        const availableB = b.getStockLevel().getAvailable();
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
    const rows = await this.prisma.$queryRaw<
      { variant_id: string; location_id: string; on_hand: number; reserved: number; low_stock_threshold: number | null; safety_stock: number | null }[]
    >`
      SELECT * FROM inventory_management.inventory_stocks
      WHERE low_stock_threshold IS NOT NULL
      AND on_hand <= low_stock_threshold
    `;

    return rows.map((r) =>
      this.toEntity({
        variantId: r.variant_id,
        locationId: r.location_id,
        onHand: r.on_hand,
        reserved: r.reserved,
        lowStockThreshold: r.low_stock_threshold,
        safetyStock: r.safety_stock,
      }),
    );
  }

  async findOutOfStockItems(): Promise<Stock[]> {
    const rows = await this.prisma.$queryRaw<
      { variant_id: string; location_id: string; on_hand: number; reserved: number; low_stock_threshold: number | null; safety_stock: number | null }[]
    >`
      SELECT * FROM inventory_management.inventory_stocks
      WHERE on_hand <= reserved
    `;

    return rows.map((r) =>
      this.toEntity({
        variantId: r.variant_id,
        locationId: r.location_id,
        onHand: r.on_hand,
        reserved: r.reserved,
        lowStockThreshold: r.low_stock_threshold,
        safetyStock: r.safety_stock,
      }),
    );
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
    const totalStats = await (this.prisma as any).inventoryStock.aggregate({
      _sum: { onHand: true },
    });

    const [lowStockCountRaw, outOfStockCountRaw] = await Promise.all([
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count FROM inventory_management.inventory_stocks
        WHERE low_stock_threshold IS NOT NULL
        AND on_hand <= low_stock_threshold
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count FROM inventory_management.inventory_stocks
        WHERE on_hand <= reserved
      `,
    ]);

    return {
      totalItems: totalStats._sum.onHand || 0,
      lowStockCount: Number(lowStockCountRaw[0]?.count || 0),
      outOfStockCount: Number(outOfStockCountRaw[0]?.count || 0),
      totalValue: 0,
    };
  }
}
