import { IReservationRepository } from "../../domain/repositories/reservation.repository";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Reservation, ReservationDTO } from "../../domain/entities/reservation.entity";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { ReservationId } from "../../domain/value-objects/reservation-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { RESERVATION_CLEANUP_BATCH_SIZE } from "../../domain/constants";
import {
  CartNotFoundError,
  ReservationNotFoundError,
  InvalidReservationOperationError,
  InvalidOperationError,
} from "../../domain/errors/cart.errors";

// Re-export the entity's canonical DTO (ISO-string dates) so existing
// consumers can keep importing `ReservationDTO` from the service barrel.
export type { ReservationDTO } from "../../domain/entities/reservation.entity";

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
  successful: ReservationDTO[];
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
  async createReservation(dto: CreateReservationDto): Promise<ReservationDTO> {
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );
    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    const existingReservation =
      await this.reservationRepository.findByCartAndVariant(
        CartId.fromString(dto.cartId),
        VariantId.fromString(dto.variantId),
      );

    if (existingReservation) {
      const newQuantity =
        existingReservation.quantity.getValue() + dto.quantity;
      existingReservation.updateQuantity(newQuantity);
      await this.reservationRepository.save(existingReservation);
      return Reservation.toDTO(existingReservation);
    }

    const reservation = Reservation.create({
      cartId: dto.cartId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      durationMinutes: dto.durationMinutes,
    });
    await this.reservationRepository.save(reservation);

    return Reservation.toDTO(reservation);
  }

  async getReservation(reservationId: string): Promise<ReservationDTO | null> {
    const reservation =
      await this.reservationRepository.findById(ReservationId.fromString(reservationId));
    return reservation ? Reservation.toDTO(reservation) : null;
  }

  async getCartReservations(cartId: string): Promise<ReservationDTO[]> {
    const reservations = await this.reservationRepository.findByCartId(
      CartId.fromString(cartId),
    );
    return reservations.map((r) => Reservation.toDTO(r));
  }

  async getActiveCartReservations(cartId: string): Promise<ReservationDTO[]> {
    const reservations = await this.reservationRepository.findActiveByCartId(
      CartId.fromString(cartId),
    );
    return reservations.map((r) => Reservation.toDTO(r));
  }

  async getVariantReservations(variantId: string): Promise<ReservationDTO[]> {
    const reservations = await this.reservationRepository.findByVariantId(
      VariantId.fromString(variantId),
    );
    return reservations.map((r) => Reservation.toDTO(r));
  }

  // ── Reservation lifecycle ────────────────────────────────────────────
  // Mutations flow through the `Reservation` aggregate (`extend`, `renew`,
  // `updateQuantity`) followed by `save(reservation)`. Release means
  // delete.

  async extendReservation(dto: ExtendReservationDto): Promise<ReservationDTO> {
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

    reservation.extend(dto.additionalMinutes);
    await this.reservationRepository.save(reservation);
    return Reservation.toDTO(reservation);
  }

  async renewReservation(dto: RenewReservationDto): Promise<ReservationDTO> {
    const reservationId = ReservationId.fromString(dto.reservationId);
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(dto.reservationId);
    }

    reservation.renew(dto.durationMinutes);
    await this.reservationRepository.save(reservation);
    return Reservation.toDTO(reservation);
  }

  async releaseReservation(reservationId: string): Promise<void> {
    const id = ReservationId.fromString(reservationId);
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }
    await this.reservationRepository.delete(id);
  }

  async adjustReservation(
    dto: AdjustReservationDto,
  ): Promise<ReservationDTO | null> {
    const reservation = await this.reservationRepository.findByCartAndVariant(
      CartId.fromString(dto.cartId),
      VariantId.fromString(dto.variantId),
    );
    if (!reservation) {
      return null;
    }
    if (dto.newQuantity <= 0) {
      throw new InvalidOperationError(
        "Cannot adjust reservation to zero or below; release it instead.",
      );
    }
    reservation.updateQuantity(dto.newQuantity);
    await this.reservationRepository.save(reservation);
    return Reservation.toDTO(reservation);
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
    const successful: ReservationDTO[] = [];
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
  ): Promise<ReservationDTO[]> {
    const reservations =
      await this.reservationRepository.findConflictingReservations(
        VariantId.fromString(variantId),
        quantity,
        excludeCartId ? CartId.fromString(excludeCartId) : undefined,
      );
    return reservations.map((r) => Reservation.toDTO(r));
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
  ): Promise<ReservationDTO[]> {
    const reservations = await this.reservationRepository.findByStatus(status);
    return reservations.map((r) => Reservation.toDTO(r));
  }

  async archiveOldReservations(olderThanDays: number): Promise<number> {
    return await this.reservationRepository.archiveOldReservations(
      olderThanDays,
    );
  }

  // Background job support
  async getReservationsForCleanup(
    batchSize: number = RESERVATION_CLEANUP_BATCH_SIZE,
  ): Promise<ReservationDTO[]> {
    const reservations =
      await this.reservationRepository.getReservationsForCleanup(batchSize);
    return reservations.map((r) => Reservation.toDTO(r));
  }
}
