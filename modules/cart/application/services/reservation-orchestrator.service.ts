import { IReservationRepository } from "../../domain/repositories/reservation.repository";
import { Reservation, ReservationDTO } from "../../domain/entities/reservation.entity";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { VariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { InsufficientInventoryError } from "../../domain/errors/cart.errors";

// Orchestrates the inventory-reservation flow: read availability, create the
// `Reservation` aggregate, persist it. Previously this lived on
// `IReservationRepository.reserveInventory`, which made the repo the
// orchestration owner — a layer violation. The repo now only persists; this
// service composes the read/write steps that span the aggregate boundary.
export class ReservationOrchestrator {
  constructor(
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async reserveInventory(
    cartId: string,
    variantId: string,
    quantity: number,
    durationMinutes?: number,
  ): Promise<ReservationDTO> {
    const variantVO = VariantId.fromString(variantId);
    const availability = await this.reservationRepository.checkAvailability(
      variantVO,
      quantity,
    );
    if (!availability.available) {
      throw new InsufficientInventoryError(variantId, quantity);
    }

    const reservation = Reservation.create({
      cartId,
      variantId,
      quantity,
      durationMinutes,
    });
    await this.reservationRepository.save(reservation);

    return Reservation.toDTO(reservation);
  }
}
