import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CancelPickupReservationCommand } from "./cancel-pickup-reservation.command";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export class CancelPickupReservationHandler implements ICommandHandler<
  CancelPickupReservationCommand,
  CommandResult<void>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: CancelPickupReservationCommand,
  ): Promise<CommandResult<void>> {
    try {
      await this.reservationService.cancelPickupReservation(
        command.reservationId,
      );

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
