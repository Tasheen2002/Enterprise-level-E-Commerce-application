import { v4 as uuidv4 } from "uuid";
import { PickupReservation } from "../../domain/entities/pickup-reservation.entity";
import { ReservationId } from "../../domain/value-objects/reservation-id.vo";
import { IPickupReservationRepository } from "../../domain/repositories/pickup-reservation.repository";
import { StockManagementService } from "./stock-management.service";

export class PickupReservationService {
  constructor(
    private readonly pickupReservationRepository: IPickupReservationRepository,
    private readonly stockManagementService: StockManagementService,
  ) {}

  async createPickupReservation(
    orderId: string,
    variantId: string,
    locationId: string,
    qty: number,
    expirationMinutes: number = 30,
  ): Promise<PickupReservation> {
    if (qty <= 0) {
      throw new Error("Reservation quantity must be greater than zero");
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    // Reserve stock in inventory
    await this.stockManagementService.reserveStock(variantId, locationId, qty);

    // Create reservation
    const reservation = PickupReservation.create({
      reservationId: ReservationId.create(uuidv4()),
      orderId,
      variantId,
      locationId,
      qty,
      expiresAt,
    });

    await this.pickupReservationRepository.save(reservation);
    return reservation;
  }

  async cancelPickupReservation(
    reservationId: string,
  ): Promise<PickupReservation> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.create(reservationId),
    );

    if (!reservation) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    if (!reservation.isActive()) {
      throw new Error("Can only cancel active reservations");
    }

    // Mark reservation as cancelled (keep record for history)
    // Note: Stock is not automatically released - manual intervention required
    const cancelledReservation = reservation.cancel();
    await this.pickupReservationRepository.save(cancelledReservation);

    return cancelledReservation;
  }

  async extendReservation(
    reservationId: string,
    additionalMinutes: number,
  ): Promise<PickupReservation> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.create(reservationId),
    );

    if (!reservation) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    if (reservation.isExpired()) {
      throw new Error("Cannot extend an expired reservation");
    }

    const newExpiresAt = new Date(reservation.getExpiresAt());
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + additionalMinutes);

    const extendedReservation = reservation.extendExpiration(newExpiresAt);
    await this.pickupReservationRepository.save(extendedReservation);

    return extendedReservation;
  }

  async getPickupReservation(
    reservationId: string,
  ): Promise<PickupReservation | null> {
    return this.pickupReservationRepository.findById(
      ReservationId.create(reservationId),
    );
  }

  async getReservationsByOrder(orderId: string): Promise<PickupReservation[]> {
    return this.pickupReservationRepository.findByOrder(orderId);
  }

  async getReservationsByLocation(
    locationId: string,
  ): Promise<PickupReservation[]> {
    return this.pickupReservationRepository.findByLocation(locationId);
  }

  async getActiveReservations(): Promise<PickupReservation[]> {
    return this.pickupReservationRepository.findActiveReservations();
  }

  async getAllReservations(): Promise<PickupReservation[]> {
    return this.pickupReservationRepository.findAllReservations();
  }

  async fulfillPickupReservation(
    reservationId: string,
  ): Promise<PickupReservation> {
    const reservation = await this.pickupReservationRepository.findById(
      ReservationId.create(reservationId),
    );

    if (!reservation) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    if (!reservation.isActive()) {
      throw new Error("Can only fulfill active reservations");
    }

    // Fulfill stock reservation (removes from inventory)
    await this.stockManagementService.fulfillReservation(
      reservation.getVariantId(),
      reservation.getLocationId(),
      reservation.getQty(),
    );

    // Mark reservation as fulfilled
    const fulfilledReservation = reservation.fulfill();
    await this.pickupReservationRepository.save(fulfilledReservation);

    return fulfilledReservation;
  }

  async getTotalReservedQty(
    variantId: string,
    locationId: string,
  ): Promise<number> {
    return this.pickupReservationRepository.getTotalReservedQty(
      variantId,
      locationId,
    );
  }
}
