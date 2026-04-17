import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PickupReservationDTO } from "../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../services/pickup-reservation.service";

export interface ExtendReservationCommand extends ICommand {
  readonly reservationId: string;
  readonly additionalMinutes: number;
}

export class ExtendReservationHandler implements ICommandHandler<
  ExtendReservationCommand,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(command: ExtendReservationCommand): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.extendReservation(
      command.reservationId,
      command.additionalMinutes,
    );
    return CommandResult.success(reservation);
  }
}
