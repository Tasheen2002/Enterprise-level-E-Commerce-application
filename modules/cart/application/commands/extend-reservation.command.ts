import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface ExtendReservationCommand extends ICommand {
  readonly reservationId: string;
  readonly additionalMinutes: number;
}

export class ExtendReservationHandler implements ICommandHandler<ExtendReservationCommand, CommandResult<ReservationDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: ExtendReservationCommand): Promise<CommandResult<ReservationDto>> {
    const reservation = await this.reservationService.extendReservation({
      reservationId: command.reservationId,
      additionalMinutes: command.additionalMinutes,
    });
    return CommandResult.success<ReservationDto>(reservation);
  }
}