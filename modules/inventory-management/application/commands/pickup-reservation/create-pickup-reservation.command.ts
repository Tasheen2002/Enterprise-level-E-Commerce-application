import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PickupReservationDTO } from "../../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface CreatePickupReservationInput extends ICommand {
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expirationMinutes?: number;
}

export class CreatePickupReservationHandler implements ICommandHandler<
  CreatePickupReservationInput,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(input: CreatePickupReservationInput): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.createPickupReservation(
      input.orderId,
      input.variantId,
      input.locationId,
      input.qty,
      input.expirationMinutes,
    );
    return CommandResult.success(reservation);
  }
}
