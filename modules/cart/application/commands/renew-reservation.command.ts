import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface RenewReservationCommand extends ICommand {
  readonly reservationId: string;
  readonly durationMinutes?: number;
}

export class RenewReservationHandler implements ICommandHandler<RenewReservationCommand, CommandResult<ReservationDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: RenewReservationCommand): Promise<CommandResult<ReservationDto>> {
    const reservation = await this.reservationService.renewReservation({
      reservationId: command.reservationId,
      durationMinutes: command.durationMinutes,
    });
    return CommandResult.success<ReservationDto>(reservation);
  }
}