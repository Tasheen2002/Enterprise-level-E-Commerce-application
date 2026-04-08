import { PrismaClient } from "@prisma/client";
import { IReservationRepository } from "../../../domain/repositories/reservation.repository";
import {
  Reservation,
  ReservationEntityData,
} from "../../../domain/entities/reservation.entity";
import { CartId } from "../../../domain/value-objects/cart-id.vo";
import { VariantId } from "../../../domain/value-objects/variant-id.vo";
import { Quantity } from "../../../domain/value-objects/quantity.vo";
import { IExternalStockService } from "../../../domain/external-services";

export class ReservationRepositoryImpl implements IReservationRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stockService?: IExternalStockService,
  ) {}

  // Core CRUD operations
  async save(reservation: Reservation): Promise<void> {
    const data = reservation.toSnapshot();

    await this.prisma.reservation.create({
      data: {
        id: data.reservationId,
        cartId: data.cartId,
        variantId: data.variantId,
        qty: data.quantity,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findById(reservationId: string): Promise<Reservation | null> {
    const reservationData = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservationData) {
      return null;
    }

    return this.mapPrismaToEntity(reservationData);
  }

  async update(reservation: Reservation): Promise<void> {
    const data = reservation.toSnapshot();

    await this.prisma.reservation.update({
      where: { id: data.reservationId },
      data: {
        qty: data.quantity,
        expiresAt: data.expiresAt,
      },
    });
  }

  async delete(reservationId: string): Promise<void> {
    await this.prisma.reservation.delete({
      where: { id: reservationId },
    });
  }

  // Cart-based operations
  async findByCartId(cartId: CartId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { cartId: cartId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findActiveByCartId(cartId: CartId): Promise<Reservation[]> {
    const now = new Date();
    const reservations = await this.prisma.reservation.findMany({
      where: {
        cartId: cartId.getValue(),
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async deleteByCartId(cartId: CartId): Promise<number> {
    const result = await this.prisma.reservation.deleteMany({
      where: { cartId: cartId.getValue() },
    });

    return result.count;
  }

  async countByCartId(cartId: CartId): Promise<number> {
    return await this.prisma.reservation.count({
      where: { cartId: cartId.getValue() },
    });
  }

  // Variant-based operations
  async findByVariantId(variantId: VariantId): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { variantId: variantId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findActiveByVariantId(variantId: VariantId): Promise<Reservation[]> {
    const now = new Date();
    const reservations = await this.prisma.reservation.findMany({
      where: {
        variantId: variantId.getValue(),
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

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

  // Cart-Variant specific operations
  async findByCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<Reservation | null> {
    const reservationData = await this.prisma.reservation.findUnique({
      where: {
        cartId_variantId: {
          cartId: cartId.getValue(),
          variantId: variantId.getValue(),
        },
      },
    });

    if (!reservationData) {
      return null;
    }

    return this.mapPrismaToEntity(reservationData);
  }

  async existsForCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<boolean> {
    const count = await this.prisma.reservation.count({
      where: {
        cartId: cartId.getValue(),
        variantId: variantId.getValue(),
      },
    });

    return count > 0;
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
    } catch (error) {
      return false; // Record not found
    }
  }

  // Expiration management
  async findExpiredReservations(): Promise<Reservation[]> {
    const now = new Date();
    const reservations = await this.prisma.reservation.findMany({
      where: { expiresAt: { lte: now } },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findExpiringSoon(
    thresholdMinutes: number = 10,
  ): Promise<Reservation[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        expiresAt: {
          gt: now,
          lte: threshold,
        },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findReservationsExpiringBetween(
    startTime: Date,
    endTime: Date,
  ): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        expiresAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  // Bulk operations
  async saveBulk(reservations: Reservation[]): Promise<void> {
    const data = reservations.map((reservation) => {
      const snapshot = reservation.toSnapshot();
      return {
        id: snapshot.reservationId,
        cartId: snapshot.cartId,
        variantId: snapshot.variantId,
        qty: snapshot.quantity,
        expiresAt: snapshot.expiresAt,
      };
    });

    await this.prisma.reservation.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateBulk(reservations: Reservation[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const reservation of reservations) {
        const data = reservation.toSnapshot();
        await tx.reservation.update({
          where: { id: data.reservationId },
          data: {
            qty: data.quantity,
            expiresAt: data.expiresAt,
          },
        });
      }
    });
  }

  async findByIds(reservationIds: string[]): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { id: { in: reservationIds } },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async deleteExpiredBefore(date: Date): Promise<number> {
    const result = await this.prisma.reservation.deleteMany({
      where: { expiresAt: { lte: date } },
    });

    return result.count;
  }

  // Business operations
  async createReservation(
    cartId: CartId,
    variantId: VariantId,
    quantity: Quantity,
    durationMinutes: number = 30,
  ): Promise<Reservation> {
    const reservation = Reservation.create({
      cartId: cartId.getValue(),
      variantId: variantId.getValue(),
      quantity: quantity.getValue(),
      durationMinutes,
    });

    await this.save(reservation);
    return reservation;
  }

  async extendReservation(
    reservationId: string,
    additionalMinutes: number,
  ): Promise<boolean> {
    const reservation = await this.findById(reservationId);
    if (!reservation) {
      return false;
    }

    const currentExpiry = reservation.getExpiresAt();
    const newExpiry = new Date(
      currentExpiry.getTime() + additionalMinutes * 60 * 1000,
    );

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { expiresAt: newExpiry },
    });

    return true;
  }

  async renewReservation(
    reservationId: string,
    durationMinutes?: number,
  ): Promise<boolean> {
    const reservation = await this.findById(reservationId);
    if (!reservation) {
      return false;
    }

    const now = new Date();
    const actualDuration = durationMinutes ?? 30; // Use 30 only if durationMinutes is null/undefined
    const newExpiry = new Date(now.getTime() + actualDuration * 60 * 1000);

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { expiresAt: newExpiry },
    });

    return true;
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    try {
      await this.delete(reservationId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Inventory management
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

    // TODO: Integrate with actual inventory service
    // This should call your inventory management service to get real stock levels
    const actualInventory = await this.getVariantInventory(
      variantId.getValue(),
    );

    const availableForReservation = Math.max(
      0,
      actualInventory - activeReserved,
    );
    const available = availableForReservation >= requestedQuantity;

    return {
      available,
      totalReserved,
      activeReserved,
      availableForReservation,
    };
  }

  private async getVariantInventory(variantId: string): Promise<number> {
    if (!this.stockService) {
      throw new Error(
        `Cannot check inventory for variant ${variantId}: StockService not injected`,
      );
    }

    const availableStock =
      await this.stockService.getTotalAvailableStock(variantId);
    return availableStock;
  }

  async reserveInventory(
    cartId: CartId,
    variantId: VariantId,
    quantity: number,
    durationMinutes: number = 30,
  ): Promise<Reservation> {
    const availability = await this.checkAvailability(variantId, quantity);
    if (!availability.available) {
      throw new Error("Insufficient inventory available for reservation");
    }

    const quantityVo = Quantity.fromNumber(quantity);
    return this.createReservation(
      cartId,
      variantId,
      quantityVo,
      durationMinutes,
    );
  }

  async adjustReservation(
    cartId: CartId,
    variantId: VariantId,
    newQuantity: number,
  ): Promise<Reservation | null> {
    const existingReservation = await this.findByCartAndVariant(
      cartId,
      variantId,
    );
    if (!existingReservation) {
      return null;
    }

    if (newQuantity <= 0) {
      await this.deleteByCartAndVariant(cartId, variantId);
      return null;
    }

    // Check if new quantity is available
    const currentQuantity = existingReservation.getQuantity().getValue();
    const quantityDifference = newQuantity - currentQuantity;

    if (quantityDifference > 0) {
      const availability = await this.checkAvailability(
        variantId,
        quantityDifference,
      );
      if (!availability.available) {
        throw new Error(
          "Insufficient inventory available for reservation adjustment",
        );
      }
    }

    await this.prisma.reservation.update({
      where: { id: existingReservation.getReservationId() },
      data: { qty: newQuantity },
    });

    return this.findById(existingReservation.getReservationId());
  }

  // Query operations
  async findByStatus(
    status: "active" | "expiring_soon" | "expired" | "recently_expired",
  ): Promise<Reservation[]> {
    const now = new Date();
    let whereClause: any = {};

    switch (status) {
      case "active":
        whereClause = { expiresAt: { gt: now } };
        break;
      case "expiring_soon":
        const soonThreshold = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
        whereClause = {
          expiresAt: {
            gt: now,
            lte: soonThreshold,
          },
        };
        break;
      case "expired":
        whereClause = { expiresAt: { lte: now } };
        break;
      case "recently_expired":
        const recentThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        whereClause = {
          expiresAt: {
            gte: recentThreshold,
            lte: now,
          },
        };
        break;
    }

    const reservations = await this.prisma.reservation.findMany({
      where: whereClause,
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findRecentReservations(
    hours: number,
    limit?: number,
  ): Promise<Reservation[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        // Assuming we add createdAt field to the schema
        expiresAt: { gte: cutoffDate },
      },
      orderBy: { expiresAt: "desc" },
      take: limit,
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async findReservationsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        expiresAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  // Advanced filtering
  async searchReservations(criteria: {
    cartId?: string;
    variantId?: string;
    status?: "active" | "expiring_soon" | "expired" | "recently_expired";
    minQuantity?: number;
    maxQuantity?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    expiresAfter?: Date;
    expiresBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Reservation[]> {
    const whereConditions: any = {};

    if (criteria.cartId) whereConditions.cartId = criteria.cartId;
    if (criteria.variantId) whereConditions.variantId = criteria.variantId;
    if (criteria.minQuantity !== undefined) {
      whereConditions.qty = {
        ...whereConditions.qty,
        gte: criteria.minQuantity,
      };
    }
    if (criteria.maxQuantity !== undefined) {
      whereConditions.qty = {
        ...whereConditions.qty,
        lte: criteria.maxQuantity,
      };
    }
    if (criteria.expiresAfter || criteria.expiresBefore) {
      whereConditions.expiresAt = {};
      if (criteria.expiresAfter)
        whereConditions.expiresAt.gte = criteria.expiresAfter;
      if (criteria.expiresBefore)
        whereConditions.expiresAt.lte = criteria.expiresBefore;
    }

    // Handle status filter
    if (criteria.status) {
      const now = new Date();
      switch (criteria.status) {
        case "active":
          whereConditions.expiresAt = { ...whereConditions.expiresAt, gt: now };
          break;
        case "expiring_soon":
          const soonThreshold = new Date(now.getTime() + 10 * 60 * 1000);
          whereConditions.expiresAt = {
            ...whereConditions.expiresAt,
            gt: now,
            lte: soonThreshold,
          };
          break;
        case "expired":
          whereConditions.expiresAt = {
            ...whereConditions.expiresAt,
            lte: now,
          };
          break;
        case "recently_expired":
          const recentThreshold = new Date(now.getTime() - 60 * 60 * 1000);
          whereConditions.expiresAt = {
            ...whereConditions.expiresAt,
            gte: recentThreshold,
            lte: now,
          };
          break;
      }
    }

    const reservations = await this.prisma.reservation.findMany({
      where: whereConditions,
      orderBy: { expiresAt: "asc" },
      take: criteria.limit,
      skip: criteria.offset,
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  // Analytics operations
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
    const soonThreshold = new Date(now.getTime() + 10 * 60 * 1000);

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
        where: { expiresAt: { gt: now, lte: soonThreshold } },
      }),
      this.prisma.reservation.aggregate({
        _sum: { qty: true },
      }),
      this.prisma.reservation.groupBy({
        by: ["variantId"],
        _sum: { qty: true },
        _count: { _all: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 10,
      }),
    ]);

    const totalQuantityReserved = quantityStats._sum?.qty || 0;
    const averageDurationMinutes = 30; // Would need to calculate from actual data

    const mostReservedVariants = variantStats.map((stat) => ({
      variantId: stat.variantId,
      totalQuantity: stat._sum?.qty || 0,
      reservationCount: stat._count._all,
    }));

    return {
      totalReservations,
      activeReservations,
      expiredReservations,
      expiringSoonReservations,
      averageDurationMinutes,
      totalQuantityReserved,
      mostReservedVariants,
    };
  }

  async getReservationsByTimeframe(
    timeframe: "hour" | "day" | "week" | "month",
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
    // This would require more complex date aggregation
    // For now, return a simplified implementation
    const results = [];
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

  // Maintenance operations
  async optimizeReservations(): Promise<number> {
    // No cleanup functionality - return 0
    return 0;
  }

  async consolidateExpiredReservations(): Promise<number> {
    // No cleanup functionality - return 0
    return 0;
  }

  async archiveOldReservations(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // In a real implementation, you'd move these to an archive table
    const count = await this.prisma.reservation.count({
      where: { expiresAt: { lt: cutoffDate } },
    });

    return count;
  }

  // Validation operations
  async validateReservationCapacity(
    variantId: VariantId,
    requestedQuantity: number,
  ): Promise<boolean> {
    const availability = await this.checkAvailability(
      variantId,
      requestedQuantity,
    );
    return availability.available;
  }

  async isReservationExtendable(reservationId: string): Promise<boolean> {
    const reservation = await this.findById(reservationId);
    if (!reservation) return false;

    // Check if reservation is still active
    return reservation.getExpiresAt() > new Date();
  }

  async canCreateReservation(
    cartId: CartId,
    variantId: VariantId,
    quantity: number,
  ): Promise<boolean> {
    const availability = await this.checkAvailability(variantId, quantity);
    return availability.available;
  }

  // Conflict resolution
  async findConflictingReservations(
    variantId: VariantId,
    quantity: number,
    excludeCartId?: CartId,
  ): Promise<Reservation[]> {
    const whereClause: any = {
      variantId: variantId.getValue(),
      expiresAt: { gt: new Date() },
    };

    if (excludeCartId) {
      whereClause.cartId = { not: excludeCartId.getValue() };
    }

    const reservations = await this.prisma.reservation.findMany({
      where: whereClause,
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async resolveReservationConflicts(variantId: VariantId): Promise<{
    resolved: number;
    conflicts: number;
    actions: Array<{
      action: "extended" | "reduced" | "cancelled";
      reservationId: string;
      details: string;
    }>;
  }> {
    // This would involve complex business logic to resolve conflicts
    // For now, return a placeholder response
    return {
      resolved: 0,
      conflicts: 0,
      actions: [],
    };
  }

  // Performance operations
  async getReservationSummary(reservationId: string): Promise<{
    reservationId: string;
    cartId: string;
    variantId: string;
    quantity: number;
    status: string;
    expiresAt: Date;
    timeUntilExpiryMinutes: number;
    canBeExtended: boolean;
  } | null> {
    const reservation = await this.findById(reservationId);
    if (!reservation) return null;

    const now = new Date();
    const expiresAt = reservation.getExpiresAt();
    const timeUntilExpiryMinutes = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)),
    );
    const status = expiresAt > now ? "active" : "expired";
    const canBeExtended = expiresAt > now;

    return {
      reservationId: reservation.getReservationId(),
      cartId: reservation.getCartId().getValue(),
      variantId: reservation.getVariantId().getValue(),
      quantity: reservation.getQuantity().getValue(),
      status,
      expiresAt,
      timeUntilExpiryMinutes,
      canBeExtended,
    };
  }

  // Transaction support
  async saveWithTransaction(
    reservation: Reservation,
    transactionContext?: any,
  ): Promise<void> {
    if (transactionContext) {
      await this.saveWithPrismaClient(reservation, transactionContext);
    } else {
      await this.save(reservation);
    }
  }

  async deleteWithTransaction(
    reservationId: string,
    transactionContext?: any,
  ): Promise<void> {
    if (transactionContext) {
      await transactionContext.reservation.delete({
        where: { id: reservationId },
      });
    } else {
      await this.delete(reservationId);
    }
  }

  async saveBulkWithTransaction(
    reservations: Reservation[],
    transactionContext?: any,
  ): Promise<void> {
    if (transactionContext) {
      const data = reservations.map((reservation) => {
        const snapshot = reservation.toSnapshot();
        return {
          id: snapshot.reservationId,
          cartId: snapshot.cartId,
          variantId: snapshot.variantId,
          qty: snapshot.quantity,
          expiresAt: snapshot.expiresAt,
        };
      });

      await transactionContext.reservation.createMany({
        data,
        skipDuplicates: true,
      });
    } else {
      await this.saveBulk(reservations);
    }
  }

  // Batch processing for background jobs
  async getReservationsForCleanup(
    batchSize: number = 100,
  ): Promise<Reservation[]> {
    const now = new Date();
    const reservations = await this.prisma.reservation.findMany({
      where: { expiresAt: { lte: now } },
      orderBy: { expiresAt: "asc" },
      take: batchSize,
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async getReservationsForExtension(
    thresholdMinutes: number,
    batchSize: number = 100,
  ): Promise<Reservation[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + thresholdMinutes * 60 * 1000);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        expiresAt: {
          gt: now,
          lte: threshold,
        },
      },
      orderBy: { expiresAt: "asc" },
      take: batchSize,
    });

    return reservations.map((reservation) =>
      this.mapPrismaToEntity(reservation),
    );
  }

  async getReservationsForNotification(
    thresholdMinutes: number,
    batchSize: number = 100,
  ): Promise<Reservation[]> {
    return this.getReservationsForExtension(thresholdMinutes, batchSize);
  }

  // Private helper methods
  private async saveWithPrismaClient(
    reservation: Reservation,
    prismaClient: any,
  ): Promise<void> {
    const data = reservation.toSnapshot();

    await prismaClient.reservation.create({
      data: {
        id: data.reservationId,
        cartId: data.cartId,
        variantId: data.variantId,
        qty: data.quantity,
        expiresAt: data.expiresAt,
      },
    });
  }

  private mapPrismaToEntity(reservationData: any): Reservation {
    const entityData: ReservationEntityData = {
      reservationId: reservationData.id,
      cartId: reservationData.cartId,
      variantId: reservationData.variantId,
      quantity: reservationData.qty,
      expiresAt: reservationData.expiresAt,
    };

    return Reservation.reconstitute(entityData);
  }
}
