import { PickupReservation, PickupReservationDTO } from "../../domain/entities/pickup-reservation.entity";
import { Stock } from "../../domain/entities/stock.entity";
import { InventoryTransaction } from "../../domain/entities/inventory-transaction.entity";
import { ReservationId } from "../../domain/value-objects/reservation-id.vo";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { OrderId } from "../../../order-management/domain/value-objects/order-id.vo";
import { IPickupReservationRepository } from "../../domain/repositories/pickup-reservation.repository";
import { IStockRepository } from "../../domain/repositories/stock.repository";
import { IInventoryTransactionRepository } from "../../domain/repositories/inventory-transaction.repository";
import {
  DomainValidationError,
  PickupReservationNotFoundError,
  InvalidOperationError,
  StockNotFoundError,
} from "../../domain/errors/inventory-management.errors";

export class PickupReservationService {
  constructor(
    private readonly pickupReservationRepository: IPickupReservationRepository,
    private readonly stockRepository: IStockRepository,
    private readonly transactionRepository: IInventoryTransactionRepository,
  ) { }

  async createPickupReservation(
    orderId: string,
    variantId: string,
    locationId: string,
    qty: number,
    expirationMinutes: number = 30,
  ): Promise<PickupReservationDTO> {
    if (qty <= 0) {
      throw new DomainValidationError("Reservation quantity must be greater than zero");
    }

    const variantVo = VariantId.fromString(variantId);
    const locationVo = LocationId.fromString(locationId);
    const stock = await this.stockRepository.findByVariantAndLocation(variantVo, locationVo);
    if (!stock) {
      throw new StockNotFoundError(`${variantId} at ${locationId}`);
    }
    stock.reserveStock(qty);
    await this.stockRepository.save(stock);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    const reservation = PickupReservation.create({ orderId, variantId, locationId, qty, expiresAt });

    await this.pickupReservationRepository.save(reservation);
    return PickupReservation.toDTO(reservation);
  }

  async cancelPickupReservation(reservationId: string): Promise<PickupReservationDTO> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.fromString(reservationId),
    );

    if (!reservation) {
      throw new PickupReservationNotFoundError(reservationId);
    }

    if (!reservation.isActive()) {
      throw new InvalidOperationError("Can only cancel active reservations");
    }

    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(reservation.variantId),
      LocationId.fromString(reservation.locationId),
    );
    if (stock) {
      stock.unreserveStock(reservation.qty);
      await this.stockRepository.save(stock);
    }

    reservation.cancel();
    await this.pickupReservationRepository.save(reservation);

    return PickupReservation.toDTO(reservation);
  }

  async extendReservation(
    reservationId: string,
    additionalMinutes: number,
  ): Promise<PickupReservationDTO> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.fromString(reservationId),
    );

    if (!reservation) {
      throw new PickupReservationNotFoundError(reservationId);
    }

    if (reservation.isExpired()) {
      throw new InvalidOperationError("Cannot extend an expired reservation");
    }

    const newExpiresAt = new Date(reservation.expiresAt);
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

    reservation.extendExpiration(newExpiresAt);
    await this.pickupReservationRepository.save(reservation);

    return PickupReservation.toDTO(reservation);
  }

  async getPickupReservation(reservationId: string): Promise<PickupReservationDTO> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.fromString(reservationId),
    );
    if (!reservation) {
      throw new PickupReservationNotFoundError(reservationId);
    }
    return PickupReservation.toDTO(reservation);
  }

  async getReservationsByOrder(orderId: string): Promise<PickupReservationDTO[]> {
    const reservations = await this.pickupReservationRepository.findByOrder(
      OrderId.fromString(orderId),
    );
    return reservations.map(PickupReservation.toDTO);
  }

  async getReservationsByLocation(locationId: string): Promise<PickupReservationDTO[]> {
    const reservations = await this.pickupReservationRepository.findByLocation(
      LocationId.fromString(locationId),
    );
    return reservations.map(PickupReservation.toDTO);
  }

  async getActiveReservations(): Promise<PickupReservationDTO[]> {
    const reservations = await this.pickupReservationRepository.findActiveReservations();
    return reservations.map(PickupReservation.toDTO);
  }
  async getAllReservations(): Promise<PickupReservationDTO[]> {
    const result = await this.pickupReservationRepository.findAll();
    return result.items.map(PickupReservation.toDTO);
  }

  async fulfillPickupReservation(reservationId: string): Promise<PickupReservationDTO> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.fromString(reservationId),
    );

    if (!reservation) {
      throw new PickupReservationNotFoundError(reservationId);
    }

    if (!reservation.isActive()) {
      throw new InvalidOperationError("Can only fulfill active reservations");
    }

    const stock = await this.stockRepository.findByVariantAndLocation(
      VariantId.fromString(reservation.variantId),
      LocationId.fromString(reservation.locationId),
    );
    if (!stock) {
      throw new StockNotFoundError(`${reservation.variantId} at ${reservation.locationId}`);
    }
    stock.fulfillReservation(reservation.qty);
    await this.stockRepository.save(stock);

    const transaction = InventoryTransaction.create({
      variantId: reservation.variantId,
      locationId: reservation.locationId,
      qtyDelta: -reservation.qty,
      reason: "order",
    });
    await this.transactionRepository.save(transaction);

    reservation.fulfill();
    await this.pickupReservationRepository.save(reservation);

    return PickupReservation.toDTO(reservation);
  }

  async getTotalReservedQty(variantId: string, locationId: string): Promise<number> {
    return this.pickupReservationRepository.getTotalReservedQty(
      VariantId.fromString(variantId),
      LocationId.fromString(locationId),
    );
  }
}
