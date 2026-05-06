import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { PaginatedResult } from "../../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { VariantId } from "../../../../product-catalog/domain/value-objects/variant-id.vo";
import { OrderId } from "../../../../order-management/domain/value-objects/order-id.vo";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";
import { ReservationId } from "../../../domain/value-objects/reservation-id.vo";
import {
  ReservationStatus,
  ReservationStatusVO,
} from "../../../domain/value-objects/reservation-status.vo";
import { LocationId } from "../../../domain/value-objects/location-id.vo";
import {
  IPickupReservationRepository,
  PickupReservationQueryOptions,
} from "../../../domain/repositories/pickup-reservation.repository";

export class PickupReservationRepositoryImpl
  extends PrismaRepository<PickupReservation>
  implements IPickupReservationRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: Prisma.PickupReservationGetPayload<object>): PickupReservation {
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
    await this.prisma.pickupReservation.upsert({
      where: { reservationId: reservation.reservationId.getValue() },
      create: {
        reservationId: reservation.reservationId.getValue(),
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

  async findById(reservationId: ReservationId): Promise<PickupReservation | null> {
    const row = await this.prisma.pickupReservation.findUnique({
      where: { reservationId: reservationId.getValue() },
    });

    return row ? this.toEntity(row) : null;
  }

  async delete(reservationId: ReservationId): Promise<void> {
    await this.prisma.pickupReservation.delete({
      where: { reservationId: reservationId.getValue() },
    });
  }

  async findByOrder(orderId: OrderId): Promise<PickupReservation[]> {
    const rows = await this.prisma.pickupReservation.findMany({
      where: { orderId: orderId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByVariant(variantId: VariantId): Promise<PickupReservation[]> {
    const rows = await this.prisma.pickupReservation.findMany({
      where: { variantId: variantId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByLocation(locationId: LocationId): Promise<PickupReservation[]> {
    const rows = await this.prisma.pickupReservation.findMany({
      where: { locationId: locationId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<PickupReservation[]> {
    const rows = await this.prisma.pickupReservation.findMany({
      where: { variantId: variantId.getValue(), locationId: locationId.getValue() },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findExpiredReservations(): Promise<PickupReservation[]> {
    const now = new Date();
    const rows = await this.prisma.pickupReservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { lt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findActiveReservations(): Promise<PickupReservation[]> {
    const now = new Date();
    const rows = await this.prisma.pickupReservation.findMany({
      where: {
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async findAll(
    options?: PickupReservationQueryOptions,
  ): Promise<PaginatedResult<PickupReservation>> {
    const {
      limit = 50,
      offset = 0,
      status,
      orderId,
      variantId,
      locationId,
      sortBy = "expiresAt",
      sortOrder = "asc",
    } = options || {};

    const where: Prisma.PickupReservationWhereInput = {};
    if (status) where.status = status.getValue();
    if (orderId) where.orderId = orderId.getValue();
    if (variantId) where.variantId = variantId.getValue();
    if (locationId) where.locationId = locationId.getValue();

    // Domain sortBy → Prisma column. `id` here is the reservation id column.
    const orderColumn: "expiresAt" | "reservationId" =
      sortBy === "id" ? "reservationId" : "expiresAt";

    const [rows, total] = await Promise.all([
      this.prisma.pickupReservation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [orderColumn]: sortOrder },
      }),
      this.prisma.pickupReservation.count({ where }),
    ]);

    const items = rows.map((r) => this.toEntity(r));
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  async findActiveByVariantAndLocation(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<PickupReservation[]> {
    const now = new Date();
    const rows = await this.prisma.pickupReservation.findMany({
      where: {
        variantId: variantId.getValue(),
        locationId: locationId.getValue(),
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return rows.map((r) => this.toEntity(r));
  }

  async getTotalReservedQty(
    variantId: VariantId,
    locationId: LocationId,
  ): Promise<number> {
    const now = new Date();
    const result = await this.prisma.pickupReservation.aggregate({
      where: {
        variantId: variantId.getValue(),
        locationId: locationId.getValue(),
        status: ReservationStatus.ACTIVE,
        expiresAt: { gte: now },
      },
      _sum: { qty: true },
    });

    return result._sum?.qty ?? 0;
  }

  async exists(reservationId: ReservationId): Promise<boolean> {
    const count = await this.prisma.pickupReservation.count({
      where: { reservationId: reservationId.getValue() },
    });

    return count > 0;
  }
}
