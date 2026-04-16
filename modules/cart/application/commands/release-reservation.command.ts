import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService } from "../services/reservation.service";

export interface ReleaseReservationCommand extends ICommand {
  readonly reservationId: string;
}

export class ReleaseReservationHandler implements ICommandHandler<ReleaseReservationCommand, CommandResult<void>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: ReleaseReservationCommand): Promise<CommandResult<void>> {
    await this.reservationService.releaseReservation(command.reservationId);
    return CommandResult.success<void>(undefined);
  }
}
