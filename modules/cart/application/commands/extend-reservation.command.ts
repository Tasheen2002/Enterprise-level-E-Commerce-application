import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDTO } from "../services/reservation.service";

export interface ExtendReservationCommand extends ICommand {
  readonly reservationId: string;
  readonly additionalMinutes: number;
}

export class ExtendReservationHandler implements ICommandHandler<ExtendReservationCommand, CommandResult<ReservationDTO>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: ExtendReservationCommand): Promise<CommandResult<ReservationDTO>> {
    const reservation = await this.reservationService.extendReservation({
      reservationId: command.reservationId,
      additionalMinutes: command.additionalMinutes,
    });
    return CommandResult.success<ReservationDTO>(reservation);
  }
}
