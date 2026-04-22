import { IReservationRepository } from "../../domain/repositories/reservation.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Reservation } from "../../domain/entities/reservation.entity";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { ReservationId } from "../../domain/value-objects/reservation-id.vo";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { Quantity } from "../../domain/value-objects/quantity.vo";
import { RESERVATION_CLEANUP_BATCH_SIZE } from "../../domain/constants";
import {
  CartNotFoundError,
  ReservationNotFoundError,
  InvalidReservationOperationError,
  InvalidOperationError,
} from "../../domain/errors/cart.errors";

// DTOs for reservation operations
interface CreateReservationDto {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}

interface ExtendReservationDto {
  reservationId: string;
  additionalMinutes: number;
}

interface RenewReservationDto {
  reservationId: string;
  durationMinutes?: number;
}

interface AdjustReservationDto {
  cartId: string;
  variantId: string;
  newQuantity: number;
}

export interface ReservationDto {
  reservationId: string;
  cartId: string;
  variantId: string;
  quantity: number;
  expiresAt: Date;
  status: "active" | "expiring_soon" | "expired" | "recently_expired";
  isExpired: boolean;
  isExpiringSoon: boolean;
  timeUntilExpirySeconds: number;
  timeUntilExpiryMinutes: number;
  canBeExtended: boolean;
}

export interface AvailabilityDto {
  available: boolean;
  totalReserved: number;
  activeReserved: number;
  availableForReservation: number;
}

export interface ReservationConflictResolutionDto {
  resolved: number;
  conflicts: number;
  actions: Array<{
    action: "extended" | "reduced" | "cancelled";
    reservationId: string;
    details: string;
  }>;
}

export interface ReservationStatisticsDto {
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
}

interface BulkReservationDto {
  cartId: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  durationMinutes?: number;
}

export interface BulkReservationResultDto {
  successful: ReservationDto[];
  failed: Array<{
    variantId: string;
    error: string;
  }>;
  totalCreated: number;
  totalFailed: number;
}

export class ReservationService {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly cartRepository: ICartRepository,
  ) {}

  // Core reservation operations
  async createReservation(dto: CreateReservationDto): Promise<ReservationDto> {
    // Validate cart exists
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );
    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    // Check if reservation already exists for this cart-variant combination
    const existingReservation =
      await this.reservationRepository.findByCartAndVariant(
        CartId.fromString(dto.cartId),
        VariantId.fromString(dto.variantId),
      );

    if (existingReservation) {
      // Update existing reservation quantity
      const newQuantity =
        existingReservation.quantity.getValue() + dto.quantity;
      existingReservation.updateQuantity(newQuantity);
      await this.reservationRepository.save(existingReservation);
      return this.mapReservationToDto(existingReservation);
    }

    // Create new reservation
    const reservation = await this.reservationRepository.createReservation(
      CartId.fromString(dto.cartId),
      VariantId.fromString(dto.variantId),
      Quantity.fromNumber(dto.quantity),
      dto.durationMinutes,
    );

    return this.mapReservationToDto(reservation);
  }

  async getReservation(reservationId: string): Promise<ReservationDto | null> {
    const reservation =
      await this.reservationRepository.findById(ReservationId.fromString(reservationId));
    return reservation ? this.mapReservationToDto(reservation) : null;
  }

  async getCartReservations(cartId: string): Promise<ReservationDto[]> {
    const reservations = await this.reservationRepository.findByCartId(
      CartId.fromString(cartId),
    );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  async getActiveCartReservations(cartId: string): Promise<ReservationDto[]> {
    const reservations = await this.reservationRepository.findActiveByCartId(
      CartId.fromString(cartId),
    );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  async getVariantReservations(variantId: string): Promise<ReservationDto[]> {
    const reservations = await this.reservationRepository.findByVariantId(
      VariantId.fromString(variantId),
    );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  // Reservation management
  async extendReservation(dto: ExtendReservationDto): Promise<ReservationDto> {
    const reservationId = ReservationId.fromString(dto.reservationId);
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(dto.reservationId);
    }

    if (!reservation.canBeExtended) {
      throw new InvalidReservationOperationError(
        "Reservation cannot be extended",
      );
    }

    const success = await this.reservationRepository.extendReservation(
      reservationId,
      dto.additionalMinutes,
    );

    if (!success) {
      throw new InvalidOperationError("Failed to extend reservation");
    }

    const updatedReservation = await this.reservationRepository.findById(reservationId);
    return this.mapReservationToDto(updatedReservation!);
  }

  async renewReservation(dto: RenewReservationDto): Promise<ReservationDto> {
    const reservationId = ReservationId.fromString(dto.reservationId);
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(dto.reservationId);
    }

    const success = await this.reservationRepository.renewReservation(
      reservationId,
      dto.durationMinutes,
    );

    if (!success) {
      throw new InvalidOperationError("Failed to renew reservation");
    }

    const updatedReservation = await this.reservationRepository.findById(reservationId);
    return this.mapReservationToDto(updatedReservation!);
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const id = ReservationId.fromString(reservationId);
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    await this.reservationRepository.releaseReservation(id);
  }

  async adjustReservation(
    dto: AdjustReservationDto,
  ): Promise<ReservationDto | null> {
    const reservation = await this.reservationRepository.adjustReservation(
      CartId.fromString(dto.cartId),
      VariantId.fromString(dto.variantId),
      dto.newQuantity,
    );

    return reservation ? this.mapReservationToDto(reservation) : null;
  }

  // Inventory management
  async checkAvailability(
    variantId: string,
    requestedQuantity: number,
  ): Promise<AvailabilityDto> {
    return await this.reservationRepository.checkAvailability(
      VariantId.fromString(variantId),
      requestedQuantity,
    );
  }

  async reserveInventory(
    cartId: string,
    variantId: string,
    quantity: number,
    durationMinutes?: number,
  ): Promise<ReservationDto> {
    const reservation = await this.reservationRepository.reserveInventory(
      CartId.fromString(cartId),
      VariantId.fromString(variantId),
      quantity,
      durationMinutes,
    );

    return this.mapReservationToDto(reservation);
  }

  async getTotalReservedQuantity(variantId: string): Promise<number> {
    return await this.reservationRepository.getTotalReservedQuantity(
      VariantId.fromString(variantId),
    );
  }

  async getActiveReservedQuantity(variantId: string): Promise<number> {
    return await this.reservationRepository.getActiveReservedQuantity(
      VariantId.fromString(variantId),
    );
  }

  // Bulk operations
  async createBulkReservations(
    dto: BulkReservationDto,
  ): Promise<BulkReservationResultDto> {
    const successful: ReservationDto[] = [];
    const failed: Array<{ variantId: string; error: string }> = [];

    for (const item of dto.items) {
      try {
        const reservation = await this.createReservation({
          cartId: dto.cartId,
          variantId: item.variantId,
          quantity: item.quantity,
          durationMinutes: dto.durationMinutes,
        });
        successful.push(reservation);
      } catch (error) {
        failed.push({
          variantId: item.variantId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      successful,
      failed,
      totalCreated: successful.length,
      totalFailed: failed.length,
    };
  }

  // Advanced operations
  async resolveReservationConflicts(
    variantId: string,
  ): Promise<ReservationConflictResolutionDto> {
    return await this.reservationRepository.resolveReservationConflicts(
      VariantId.fromString(variantId),
    );
  }

  async findConflictingReservations(
    variantId: string,
    quantity: number,
    excludeCartId?: string,
  ): Promise<ReservationDto[]> {
    const reservations =
      await this.reservationRepository.findConflictingReservations(
        VariantId.fromString(variantId),
        quantity,
        excludeCartId ? CartId.fromString(excludeCartId) : undefined,
      );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  // Analytics and reporting
  async getReservationStatistics(): Promise<ReservationStatisticsDto> {
    return await this.reservationRepository.getReservationStatistics();
  }

  async getReservationsByTimeframe(
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
  > {
    return await this.reservationRepository.getReservationsByTimeframe(
      timeframe,
      count,
    );
  }

  async getReservationsByStatus(
    status: "active" | "expiring_soon" | "expired" | "recently_expired",
  ): Promise<ReservationDto[]> {
    const reservations = await this.reservationRepository.findByStatus(status);
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  // Validation operations
  async validateReservationCapacity(
    variantId: string,
    requestedQuantity: number,
  ): Promise<boolean> {
    return await this.reservationRepository.validateReservationCapacity(
      VariantId.fromString(variantId),
      requestedQuantity,
    );
  }

  async isReservationExtendable(reservationId: string): Promise<boolean> {
    return await this.reservationRepository.isReservationExtendable(
      ReservationId.fromString(reservationId),
    );
  }

  async canCreateReservation(
    cartId: string,
    variantId: string,
    quantity: number,
  ): Promise<boolean> {
    return await this.reservationRepository.canCreateReservation(
      CartId.fromString(cartId),
      VariantId.fromString(variantId),
      quantity,
    );
  }

  async optimizeReservations(): Promise<number> {
    // For now, just return 0 since we removed cleanup functionality
    return 0;
  }

  async archiveOldReservations(olderThanDays: number): Promise<number> {
    return await this.reservationRepository.archiveOldReservations(
      olderThanDays,
    );
  }

  // Background job support
  async getReservationsForCleanup(
    batchSize: number = RESERVATION_CLEANUP_BATCH_SIZE,
  ): Promise<ReservationDto[]> {
    const reservations =
      await this.reservationRepository.getReservationsForCleanup(batchSize);
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  async getReservationsForExtension(
    thresholdMinutes: number,
    batchSize: number = RESERVATION_CLEANUP_BATCH_SIZE,
  ): Promise<ReservationDto[]> {
    const reservations =
      await this.reservationRepository.getReservationsForExtension(
        thresholdMinutes,
        batchSize,
      );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  async getReservationsForNotification(
    thresholdMinutes: number,
    batchSize: number = RESERVATION_CLEANUP_BATCH_SIZE,
  ): Promise<ReservationDto[]> {
    const reservations =
      await this.reservationRepository.getReservationsForNotification(
        thresholdMinutes,
        batchSize,
      );
    return reservations.map((r) => this.mapReservationToDto(r));
  }

  // Utility methods
  private mapReservationToDto(reservation: Reservation): ReservationDto {
    return {
      reservationId: reservation.reservationId.getValue(),
      cartId: reservation.cartId.getValue(),
      variantId: reservation.variantId.getValue(),
      quantity: reservation.quantity.getValue(),
      expiresAt: reservation.expiresAt,
      status: reservation.status,
      isExpired: reservation.isExpired,
      isExpiringSoon: reservation.isExpiringSoon(),
      timeUntilExpirySeconds: reservation.timeUntilExpirySeconds,
      timeUntilExpiryMinutes: reservation.timeUntilExpiryMinutes,
      canBeExtended: reservation.canBeExtended,
    };
  }
}