import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PickupReservationDTO } from "../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../services/pickup-reservation.service";

export interface CancelPickupReservationCommand extends ICommand {
  readonly reservationId: string;
}

export class CancelPickupReservationHandler implements ICommandHandler<
  CancelPickupReservationCommand,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(command: CancelPickupReservationCommand): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.cancelPickupReservation(command.reservationId);
    return CommandResult.success(reservation);
  }
}
