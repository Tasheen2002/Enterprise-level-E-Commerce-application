import { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";
import { ReservationId } from "../../../domain/value-objects/reservation-id.vo";
import {
  ReservationStatus,
  ReservationStatusVO,
} from "../../../domain/value-objects/reservation-status.vo";
import { IPickupReservationRepository } from "../../../domain/repositories/pickup-reservation.repository";

interface PickupReservationDatabaseRow {
  reservationId: string;
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expiresAt: Date;
  status: string;
}

export class PickupReservationRepositoryImpl
  extends PrismaRepository<PickupReservation>
  implements IPickupReservationRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: PickupReservationDatabaseRow): PickupReservation {
    return PickupReservation.fromPersistence({
      reservationId: ReservationId.fromString(row.reservationId),
      orderId: row.orderId,
      variantId: row.variantId,
      locationId: row.locationId,
      qty: row.qty,
      expiresAt: row.expiresAt,
      status: ReservationStatusVO.create(row.status ?? ReservationStatus.ACTIVE),
    });
  }

  async save(reservation: PickupReservation): Promise<void> {
    const reservationId = reservation.reservationId.getValue();

    await (this.prisma as any).pickupReservation.upsert({
      where: { reservationId },
      create: {
        reservationId,
        orderId: reservation.orderId,
        variantId: reservation.variantId,
        locationId: reservation.locationId,
        qty: reservation.qty,
        expiresAt: reservation.expiresAt,
        status: reservation.status.getValue(),
      },
      update: {
        qty: reservation.qty,
        expiresAt: reservation.expiresAt,
        status: reservation.status.getValue(),
      },
    });

    await this.dispatchEvents(reservation);
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
    const now = new Date();
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: { expiresAt: { lt: now } },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
  }

  async findActiveReservations(): Promise<PickupReservation[]> {
    const now = new Date();
    const reservations = await (this.prisma as any).pickupReservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return reservations.map((r: PickupReservationDatabaseRow) =>
      this.toEntity(r),
    );
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
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
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
    const now = new Date();
    const result = await (this.prisma as any).pickupReservation.aggregate({
      where: {
        variantId,
        locationId,
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
      },
      _sum: { qty: true },
    });

    return result._sum?.qty ?? 0;
  }

  async exists(reservationId: ReservationId): Promise<boolean> {
    const count = await (this.prisma as any).pickupReservation.count({
      where: { reservationId: reservationId.getValue() },
    });

    return count > 0;
  }
}
