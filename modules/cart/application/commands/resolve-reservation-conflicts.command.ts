import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationConflictResolutionDto } from "../services/reservation.service";

export interface ResolveReservationConflictsCommand extends ICommand {
  readonly variantId: string;
}

export class ResolveReservationConflictsHandler implements ICommandHandler<ResolveReservationConflictsCommand, CommandResult<ReservationConflictResolutionDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: ResolveReservationConflictsCommand): Promise<CommandResult<ReservationConflictResolutionDto>> {
    const result = await this.reservationService.resolveReservationConflicts(command.variantId);
    return CommandResult.success<ReservationConflictResolutionDto>(result);
  }
}
