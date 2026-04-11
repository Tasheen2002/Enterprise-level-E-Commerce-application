import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PickupReservationDTO } from "../../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface CancelPickupReservationInput extends ICommand {
  reservationId: string;
}

export class CancelPickupReservationHandler implements ICommandHandler<
  CancelPickupReservationInput,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(input: CancelPickupReservationInput): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.cancelPickupReservation(input.reservationId);
    return CommandResult.success(reservation);
  }
}
