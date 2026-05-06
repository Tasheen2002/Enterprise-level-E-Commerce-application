import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IReservationRepository } from "../../../domain/repositories/reservation.repository";
import {
  Reservation,
  ReservationEntityData,
} from "../../../domain/entities/reservation.entity";
import { CartId } from "../../../domain/value-objects/cart-id.vo";
import { ReservationId } from "../../../domain/value-objects/reservation-id.vo";
import { VariantId } from "../../../../product-catalog/domain/value-objects/variant-id.vo";
import { IExternalStockService } from "../../../domain/ports/external-services";

export class ReservationRepositoryImpl
  extends PrismaRepository<Reservation>
  implements IReservationRepository
{
  constructor(
    prisma: PrismaClient,
    private readonly stockService?: IExternalStockService,
    eventBus?: IEventBus,
  ) {
    super(prisma, eventBus);
  }

  // ── Aggregate persistence ──────────────────────────────────────────

  async save(reservation: Reservation): Promise<void> {
    const data = reservation.toSnapshot();

    await this.prisma.reservation.upsert({
      where: { id: data.reservationId },
      create: {
        id: data.reservationId,
        cartId: data.cartId,
        variantId: data.variantId,
        qty: data.quantity,
        expiresAt: data.expiresAt,
      },
      update: {
        qty: data.quantity,
        expiresAt: data.expiresAt,
      },
    });

    await this.dispatchEvents(reservation);
  }

  async findById(reservationId: ReservationId): Promise<Reservation | null> {
    const row = await this.prisma.reservation.findUnique({
      where: { id: reservationId.getValue() },
    });
    return row ? this.toDomain(row) : null;
  }

  async delete(reservationId: ReservationId): Promise<void> {
    await this.prisma.reservation.delete({
      where: { id: reservationId.getValue() },
    });
  }

  // ── Lookups by alternate key ───────────────────────────────────────

  async findByCartId(cartId: CartId): Promise<Reservation[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { cartId: cartId.getValue() },
      orderBy: { expiresAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findActiveByCartId(cartId: CartId): Promise<Reservation[]> {
    const now = new Date();
    const rows = await this.prisma.reservation.findMany({
      where: {
        cartId: cartId.getValue(),
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<Reservation | null> {
    const row = await this.prisma.reservation.findUnique({
      where: {
        cartId_variantId: {
          cartId: cartId.getValue(),
          variantId: variantId.getValue(),
        },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByVariantId(variantId: VariantId): Promise<Reservation[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { variantId: variantId.getValue() },
      orderBy: { expiresAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByStatus(
    status: "active" | "expiring_soon" | "expired" | "recently_expired",
  ): Promise<Reservation[]> {
    const now = new Date();
    let where: Prisma.ReservationWhereInput = {};

    switch (status) {
      case "active":
        where = { expiresAt: { gt: now } };
        break;
      case "expiring_soon": {
        const soon = new Date(now.getTime() + 10 * 60 * 1000);
        where = { expiresAt: { gt: now, lte: soon } };
        break;
      }
      case "expired":
        where = { expiresAt: { lte: now } };
        break;
      case "recently_expired": {
        const recent = new Date(now.getTime() - 60 * 60 * 1000);
        where = { expiresAt: { gte: recent, lte: now } };
        break;
      }
    }

    const rows = await this.prisma.reservation.findMany({
      where,
      orderBy: { expiresAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  // ── Bulk delete (cart cleanup) ─────────────────────────────────────

  async deleteByCartId(cartId: CartId): Promise<number> {
    const result = await this.prisma.reservation.deleteMany({
      where: { cartId: cartId.getValue() },
    });
    return result.count;
  }

  async deleteByCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<boolean> {
    try {
      await this.prisma.reservation.delete({
        where: {
          cartId_variantId: {
            cartId: cartId.getValue(),
            variantId: variantId.getValue(),
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  // ── Quantity aggregates ────────────────────────────────────────────

  async getTotalReservedQuantity(variantId: VariantId): Promise<number> {
    const result = await this.prisma.reservation.aggregate({
      where: { variantId: variantId.getValue() },
      _sum: { qty: true },
    });
    return result._sum?.qty || 0;
  }

  async getActiveReservedQuantity(variantId: VariantId): Promise<number> {
    const now = new Date();
    const result = await this.prisma.reservation.aggregate({
      where: {
        variantId: variantId.getValue(),
        expiresAt: { gt: now },
      },
      _sum: { qty: true },
    });
    return result._sum?.qty || 0;
  }

  // ── Availability / conflict checks ─────────────────────────────────

  async checkAvailability(
    variantId: VariantId,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    totalReserved: number;
    activeReserved: number;
    availableForReservation: number;
  }> {
    const totalReserved = await this.getTotalReservedQuantity(variantId);
    const activeReserved = await this.getActiveReservedQuantity(variantId);
    const actualInventory = await this.getVariantInventory(variantId.getValue());

    const availableForReservation = Math.max(0, actualInventory - activeReserved);
    const available = availableForReservation >= requestedQuantity;

    return {
      available,
      totalReserved,
      activeReserved,
      availableForReservation,
    };
  }

  async findConflictingReservations(
    variantId: VariantId,
    quantity: number,
    excludeCartId?: CartId,
  ): Promise<Reservation[]> {
    const where: Prisma.ReservationWhereInput = {
      variantId: variantId.getValue(),
      expiresAt: { gt: new Date() },
      ...(excludeCartId ? { cartId: { not: excludeCartId.getValue() } } : {}),
    };

    const rows = await this.prisma.reservation.findMany({
      where,
      orderBy: { expiresAt: "asc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async resolveReservationConflicts(_variantId: VariantId): Promise<{
    resolved: number;
    conflicts: number;
    actions: Array<{
      action: "extended" | "reduced" | "cancelled";
      reservationId: string;
      details: string;
    }>;
  }> {
    // Placeholder for conflict-resolution logic that would scan competing
    // reservations on the variant and decide whether to extend / reduce /
    // cancel. Live business rules belong in a domain service rather than
    // the repository — this stays a no-op until that service exists.
    return { resolved: 0, conflicts: 0, actions: [] };
  }

  // ── Analytics / reporting ──────────────────────────────────────────

  async getReservationStatistics(): Promise<{
    totalReservations: number;
    activeReservations: number;
    expiredReservations: number;
    expiringSoonReservations: number;
    averageDurationMinutes: number;
    totalQuantityReserved: number;
    mostReservedVariants: Array<{
      variantId: string;
      totalQuantity: number;
      reservationCount: number;
    }>;
  }> {
    const now = new Date();
    const soon = new Date(now.getTime() + 10 * 60 * 1000);

    const [
      totalReservations,
      activeReservations,
      expiredReservations,
      expiringSoonReservations,
      quantityStats,
      variantStats,
    ] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.reservation.count({ where: { expiresAt: { lte: now } } }),
      this.prisma.reservation.count({
        where: { expiresAt: { gt: now, lte: soon } },
      }),
      this.prisma.reservation.aggregate({ _sum: { qty: true } }),
      this.prisma.reservation.groupBy({
        by: ["variantId"],
        _sum: { qty: true },
        _count: { _all: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 10,
      }),
    ]);

    return {
      totalReservations,
      activeReservations,
      expiredReservations,
      expiringSoonReservations,
      averageDurationMinutes: 30,
      totalQuantityReserved: quantityStats._sum?.qty || 0,
      mostReservedVariants: variantStats.map((stat) => ({
        variantId: stat.variantId,
        totalQuantity: stat._sum?.qty || 0,
        reservationCount: stat._count._all,
      })),
    };
  }

  async getReservationsByTimeframe(
    _timeframe: "hour" | "day" | "week" | "month",
    count: number = 24,
  ): Promise<
    Array<{
      period: string;
      reservationCount: number;
      totalQuantity: number;
      uniqueVariants: number;
      uniqueCarts: number;
    }>
  > {
    // Placeholder bucketing — real implementation requires Prisma `$queryRaw`
    // with date_trunc / generate_series. Returns empty buckets for now so
    // callers don't break; replace with real aggregation when dashboards
    // start consuming this.
    const results: Array<{
      period: string;
      reservationCount: number;
      totalQuantity: number;
      uniqueVariants: number;
      uniqueCarts: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      results.push({
        period: `period-${i}`,
        reservationCount: 0,
        totalQuantity: 0,
        uniqueVariants: 0,
        uniqueCarts: 0,
      });
    }
    return results;
  }

  // ── Background-job batch hooks ─────────────────────────────────────

  async archiveOldReservations(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    return this.prisma.reservation.count({
      where: { expiresAt: { lt: cutoff } },
    });
  }

  async getReservationsForCleanup(batchSize: number = 100): Promise<Reservation[]> {
    const now = new Date();
    const rows = await this.prisma.reservation.findMany({
      where: { expiresAt: { lte: now } },
      orderBy: { expiresAt: "asc" },
      take: batchSize,
    });
    return rows.map((row) => this.toDomain(row));
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async getVariantInventory(variantId: string): Promise<number> {
    if (!this.stockService) {
      throw new Error(
        `Cannot check inventory for variant ${variantId}: StockService not injected`,
      );
    }
    return this.stockService.getTotalAvailableStock(variantId);
  }

  private toDomain(row: Prisma.ReservationGetPayload<Record<string, never>>): Reservation {
    const fallbackDate = new Date(0);
    const entityData: ReservationEntityData = {
      reservationId: row.id,
      cartId: row.cartId,
      variantId: row.variantId,
      quantity: row.qty,
      expiresAt: row.expiresAt,
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
    };
    return Reservation.fromPersistence(entityData);
  }
}
