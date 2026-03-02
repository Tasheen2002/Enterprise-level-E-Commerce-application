import { PrismaClient } from "@prisma/client";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";
import { ReservationId } from "../../../domain/value-objects/reservation-id.vo";
import { IPickupReservationRepository } from "../../../domain/repositories/pickup-reservation.repository";

interface PickupReservationDatabaseRow {
  reservationId: string;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
}

class ReservationStatusTracker {
  private static cancelledReservations = new Set<string>();
  private static fulfilledReservations = new Set<string>();
  private static expiredReservations = new Set<string>();

  static markCancelled(reservationId: string): void {
    this.cancelledReservations.add(reservationId);
    this.expiredReservations.delete(reservationId);
  }

  static markFulfilled(reservationId: string): void {
    this.fulfilledReservations.add(reservationId);
    this.expiredReservations.delete(reservationId);
    this.cancelledReservations.delete(reservationId);
  }

  static markExpired(reservationId: string): void {
    this.expiredReservations.add(reservationId);
  }

  static isCancelled(reservationId: string): boolean {
    return this.cancelledReservations.has(reservationId);
  }

  static isFulfilled(reservationId: string): boolean {
    return this.fulfilledReservations.has(reservationId);
  }

  static isManuallyExpired(reservationId: string): boolean {
    return this.expiredReservations.has(reservationId);
  }

  static clear(): void {
    this.cancelledReservations.clear();
    this.fulfilledReservations.clear();
    this.expiredReservations.clear();
  }
}

export class PickupReservationRepositoryImpl implements IPickupReservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: PickupReservationDatabaseRow): PickupReservation {
    return PickupReservation.reconstitute({
      reservationId: ReservationId.create(row.reservationId),
      orderId: row.orderId,
      variantId: row.variantId,
      locationId: row.locationId,
      qty: row.qty,
      expiresAt: row.expiresAt,
      isCancelled: ReservationStatusTracker.isCancelled(row.reservationId),
      isManuallyExpired: ReservationStatusTracker.isManuallyExpired(
        row.reservationId,
      ),
      isFulfilled: ReservationStatusTracker.isFulfilled(row.reservationId),
    });
  }

  async save(reservation: PickupReservation): Promise<void> {
    const reservationId = reservation.getReservationId().getValue();

    if (reservation.isCancelled()) {
      ReservationStatusTracker.markCancelled(reservationId);
    }
    if (reservation.isFulfilled()) {
      ReservationStatusTracker.markFulfilled(reservationId);
    }
    if (
      reservation.isExpired() &&
      !reservation.isCancelled() &&
      !reservation.isFulfilled()
    ) {
      ReservationStatusTracker.markExpired(reservationId);
    }

    await (this.prisma as any).pickupReservation.upsert({
      where: { reservationId },
      create: {
        reservationId,
        orderId: reservation.getOrderId(),
        variantId: reservation.getVariantId(),
        locationId: reservation.getLocationId(),
        qty: reservation.getQty(),
        expiresAt: reservation.getExpiresAt(),
      },
      update: {
        qty: reservation.getQty(),
        expiresAt: reservation.getExpiresAt(),
      },
    });
  }

  async findById(
    reservationId: ReservationId,
  ): Promise<PickupReservation | null> {
    const reservation = await (this.prisma as any).pickupReservation.findUnique(
      {
        where: { reservationId: reservationId.getValue() },
      },
    );

    if (!reservation) {
      return null;
    }

    return this.toEntity(reservation as PickupReservationDatabaseRow);
  }

  async delete(reservationId: ReservationId): Promise<void> {
    await (this.prisma as any).pickupReservation.delete({
      where: { reservationId: reservationId.getValue() },
    });
  }

  async findByOrder(orderId: string): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: { orderId },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findByVariant(variantId: string): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: { variantId },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findByLocation(locationId: string): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: { locationId },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: { variantId, locationId },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findExpiredReservations(): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      orderBy: { expiresAt: "asc" },
    });

    return reservations
      .map((r: PickupReservationDatabaseRow) => this.toEntity(r))
      .filter((r: PickupReservation) => r.isExpired());
  }

  async findActiveReservations(): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      orderBy: { expiresAt: "asc" },
    });

    return reservations
      .map((r: PickupReservationDatabaseRow) => this.toEntity(r))
      .filter((r: PickupReservation) => r.isActive());
  }

  async findAllReservations(): Promise<PickupReservation[]> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findActiveByVariantAndLocation(
    variantId: string,
    locationId: string,
  ): Promise<PickupReservation[]> {
    const now = new Date();
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: {
        variantId,
        locationId,
        expiresAt: {
          gte: now,
        },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async getTotalReservedQty(
    variantId: string,
    locationId: string,
  ): Promise<number> {
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: {
        variantId,
        locationId,
      },
    });

    return reservations
      .map((r: PickupReservationDatabaseRow) => this.toEntity(r))
      .filter((r: PickupReservation) => r.isActive())
      .reduce((total: number, r: PickupReservation) => total + r.getQty(), 0);
  }

  async exists(reservationId: ReservationId): Promise<boolean> {
    const count = await (this.prisma as any).pickupReservation.count({
      where: { reservationId: reservationId.getValue() },
    });

    return count > 0;
  }
}
