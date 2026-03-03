import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface CancelPickupReservationCommand extends ICommand {
  reservationId: string;
}

export class CancelPickupReservationHandler implements ICommandHandler<
  CancelPickupReservationCommand,
  CommandResult<void>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: CancelPickupReservationCommand,
  ): Promise<CommandResult<void>> {
    try {
      const errors: string[] = [];

      if (!command.reservationId || command.reservationId.trim().length === 0) {
        errors.push("reservationId: Reservation ID is required");
      }

      if (errors.length > 0) {
        return CommandResult.failure<void>("Validation failed", errors);
      }

      await this.reservationService.cancelPickupReservation(
        command.reservationId,
      );

      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

