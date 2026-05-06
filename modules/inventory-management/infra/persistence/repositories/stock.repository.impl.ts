import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../../product-catalog/domain/value-objects/variant-id.vo";
import { Stock } from "../../../domain/entities/stock.entity";
import { StockLevel } from "../../../domain/value-objects/stock-level.vo";
import { LocationId } from "../../../domain/value-objects/location-id.vo";
import { StockId } from "../../../domain/value-objects/stock-id.vo";
import { IStockRepository } from "../../../domain/repositories/stock.repository";

export class StockRepositoryImpl
  extends PrismaRepository<Stock>
  implements IStockRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(
    row: Pick<
      Prisma.InventoryStockGetPayload<object>,
      "variantId" | "locationId" | "onHand" | "reserved" | "lowStockThreshold" | "safetyStock"
    >,
  ): Stock {
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

  async findByStockId(stockId: StockId): Promise<Stock | null> {
    const { variantId, locationId } = stockId.getValue();
    const row = await this.prisma.inventoryStock.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });

    return row ? this.toEntity(row) : null;
  }

  async findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<Stock | null> {
    const row = await this.prisma.inventoryStock.findUnique({
      where: {
        variantId_locationId: {
          variantId: variantId.getValue(),
          locationId: locationId.getValue(),
        },
      },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(stockId: StockId): Promise<void> {
    const { variantId, locationId } = stockId.getValue();
    await this.prisma.inventoryStock.delete({
      where: { variantId_locationId: { variantId, locationId } },
    });
  }

  async findByVariant(variantId: VariantId): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { variantId: variantId.getValue() },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByLocation(locationId: LocationId): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { locationId: locationId.getValue() },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: "low_stock" | "out_of_stock" | "in_stock";
    locationId?: LocationId;
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
      where.locationId = locationId.getValue();
    }

    let orderBy: Prisma.InventoryStockOrderByWithRelationInput = { variantId: "asc" };
    if (sortBy === "onHand") {
      orderBy = { onHand: sortOrder };
    } else if (sortBy === "location") {
      orderBy = { locationId: sortOrder };
    } else if (sortBy === "product") {
      orderBy = { variant: { product: { title: sortOrder } } };
    }

    // Cart reservations (separate table) augment `reserved` for the purpose
    // of computing isLowStock/isOutOfStock. Status filtering and sorting by
    // available therefore need the augmented values, which Prisma can't
    // express in a `where` clause without a raw subquery. Pragmatic
    // compromise: when `status` filter or `available` sort is active, fetch
    // matching rows + enrich + filter/sort in memory, then slice for the
    // page. Acceptable while inventory size is bounded (~10k rows); revisit
    // with `$queryRaw` + CTE if the table grows large.
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
    // Filter at the DB layer: fetch only rows where `onHand <= lowStockThreshold`.
    // Prisma's `where` doesn't support field-to-field comparison, so we use
    // a raw query to get matching keys, then load via Prisma for entity
    // hydration consistency.
    const matches = await this.prisma.$queryRaw<
      Array<{ variantId: string; locationId: string }>
    >`
      SELECT variant_id AS "variantId", location_id AS "locationId"
      FROM inventory_management.inventory_stock
      WHERE low_stock_threshold IS NOT NULL
        AND on_hand <= low_stock_threshold
    `;

    if (matches.length === 0) return [];

    const rows = await this.prisma.inventoryStock.findMany({
      where: {
        OR: matches.map((m) => ({
          variantId: m.variantId,
          locationId: m.locationId,
        })),
      },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findOutOfStockItems(): Promise<Stock[]> {
    const rows = await this.prisma.inventoryStock.findMany({
      where: { onHand: { lte: 0 } },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async getTotalAvailableStock(variantId: VariantId): Promise<number> {
    const result = await this.prisma.inventoryStock.aggregate({
      where: { variantId: variantId.getValue() },
      _sum: { onHand: true, reserved: true },
    });

    return (result._sum.onHand ?? 0) - (result._sum.reserved ?? 0);
  }

  async exists(stockId: StockId): Promise<boolean> {
    const { variantId, locationId } = stockId.getValue();
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
    // Raw aggregation: counts and sums computed at the DB layer rather than
    // loading every row. The previous fetch-all-then-filter pattern hit
    // memory hard at scale. Cart reservations are NOT included in these
    // counts (consistent with previous behaviour) — this is the persisted
    // stock-level snapshot.
    const [totalStats, lowStockCount, outOfStockCount] = await Promise.all([
      this.prisma.inventoryStock.aggregate({ _sum: { onHand: true } }),
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM inventory_management.inventory_stock
        WHERE low_stock_threshold IS NOT NULL
          AND on_hand <= low_stock_threshold
      `,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM inventory_management.inventory_stock
        WHERE on_hand <= reserved
      `,
    ]);

    return {
      totalItems: totalStats._sum.onHand ?? 0,
      lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      outOfStockCount: Number(outOfStockCount[0]?.count ?? 0),
      totalValue: 0,
    };
  }
}
