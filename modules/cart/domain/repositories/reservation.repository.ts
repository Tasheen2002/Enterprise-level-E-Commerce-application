import { Reservation } from "../entities/reservation.entity";
import { CartId } from "../value-objects/cart-id.vo";
import { VariantId } from "../value-objects/variant-id.vo";
import { Quantity } from "../value-objects/quantity.vo";

export interface IReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(reservationId: string): Promise<Reservation | null>;
  update(reservation: Reservation): Promise<void>;
  delete(reservationId: string): Promise<void>;
  findByCartId(cartId: CartId): Promise<Reservation[]>;
  findActiveByCartId(cartId: CartId): Promise<Reservation[]>;
  deleteByCartId(cartId: CartId): Promise<number>;
  countByCartId(cartId: CartId): Promise<number>;
  findByVariantId(variantId: VariantId): Promise<Reservation[]>;
  findActiveByVariantId(variantId: VariantId): Promise<Reservation[]>;
  getTotalReservedQuantity(variantId: VariantId): Promise<number>;
  getActiveReservedQuantity(variantId: VariantId): Promise<number>;
  findByCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<Reservation | null>;
  existsForCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<boolean>;
  deleteByCartAndVariant(
    cartId: CartId,
    variantId: VariantId,
  ): Promise<boolean>;
  findExpiredReservations(): Promise<Reservation[]>;
  findExpiringSoon(thresholdMinutes?: number): Promise<Reservation[]>;
  findReservationsExpiringBetween(
    startTime: Date,
    endTime: Date,
  ): Promise<Reservation[]>;
  saveBulk(reservations: Reservation[]): Promise<void>;
  updateBulk(reservations: Reservation[]): Promise<void>;
  findByIds(reservationIds: string[]): Promise<Reservation[]>;
  deleteExpiredBefore(date: Date): Promise<number>;
  createReservation(
    cartId: CartId,
    variantId: VariantId,
    quantity: Quantity,
    durationMinutes?: number,
  ): Promise<Reservation>;

  extendReservation(
    reservationId: string,
    additionalMinutes: number,
  ): Promise<boolean>;
  renewReservation(
    reservationId: string,
    durationMinutes?: number,
  ): Promise<boolean>;
  releaseReservation(reservationId: string): Promise<boolean>;
  checkAvailability(
    variantId: VariantId,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    totalReserved: number;
    activeReserved: number;
    availableForReservation: number;
  }>;

  reserveInventory(
    cartId: CartId,
    variantId: VariantId,
    quantity: number,
    durationMinutes?: number,
  ): Promise<Reservation>;

  adjustReservation(
    cartId: CartId,
    variantId: VariantId,
    newQuantity: number,
  ): Promise<Reservation | null>;
  findByStatus(
    status: "active" | "expiring_soon" | "expired" | "recently_expired",
  ): Promise<Reservation[]>;
  findRecentReservations(hours: number, limit?: number): Promise<Reservation[]>;
  findReservationsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]>;
  searchReservations(criteria: {
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
  }): Promise<Reservation[]>;
  getReservationStatistics(): Promise<{
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
  }>;

  getReservationsByTimeframe(
    timeframe: "hour" | "day" | "week" | "month",
    count?: number,
  ): Promise<
    Array<{
      period: string;
      reservationCount: number;
      totalQuantity: number;
      uniqueVariants: number;
      uniqueCarts: number;
    }>
  >;
  optimizeReservations(): Promise<number>;
  consolidateExpiredReservations(): Promise<number>;
  archiveOldReservations(olderThanDays: number): Promise<number>;
  validateReservationCapacity(
    variantId: VariantId,
    requestedQuantity: number,
  ): Promise<boolean>;
  isReservationExtendable(reservationId: string): Promise<boolean>;
  canCreateReservation(
    cartId: CartId,
    variantId: VariantId,
    quantity: number,
  ): Promise<boolean>;
  findConflictingReservations(
    variantId: VariantId,
    quantity: number,
    excludeCartId?: CartId,
  ): Promise<Reservation[]>;

  resolveReservationConflicts(variantId: VariantId): Promise<{
    resolved: number;
    conflicts: number;
    actions: Array<{
      action: "extended" | "reduced" | "cancelled";
      reservationId: string;
      details: string;
    }>;
  }>;
  getReservationSummary(reservationId: string): Promise<{
    reservationId: string;
    cartId: string;
    variantId: string;
    quantity: number;
    status: string;
    expiresAt: Date;
    timeUntilExpiryMinutes: number;
    canBeExtended: boolean;
  } | null>;
  saveWithTransaction(
    reservation: Reservation,
    transactionContext?: any,
  ): Promise<void>;
  deleteWithTransaction(
    reservationId: string,
    transactionContext?: any,
  ): Promise<void>;
  saveBulkWithTransaction(
    reservations: Reservation[],
    transactionContext?: any,
  ): Promise<void>;
  getReservationsForCleanup(batchSize?: number): Promise<Reservation[]>;
  getReservationsForExtension(
    thresholdMinutes: number,
    batchSize?: number,
  ): Promise<Reservation[]>;
  getReservationsForNotification(
    thresholdMinutes: number,
    batchSize?: number,
  ): Promise<Reservation[]>;
}
