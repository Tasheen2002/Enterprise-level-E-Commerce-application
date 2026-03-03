import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PickupReservationService } from "../../services/pickup-reservation.service";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";

export interface ExtendReservationCommand extends ICommand {
  reservationId: string;
  additionalMinutes: number;
}

export class ExtendReservationHandler implements ICommandHandler<
  ExtendReservationCommand,
  CommandResult<PickupReservation>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: ExtendReservationCommand,
  ): Promise<CommandResult<PickupReservation>> {
    try {
      const errors: string[] = [];

      if (!command.reservationId || command.reservationId.trim().length === 0) {
        errors.push("reservationId: Reservation ID is required");
      }

      if (
        command.additionalMinutes === undefined ||
        command.additionalMinutes === null
      ) {
        errors.push("additionalMinutes: Additional minutes is required");
      } else if (command.additionalMinutes <= 0) {
        errors.push("additionalMinutes: Additional minutes must be greater than zero");
      }

      if (errors.length > 0) {
        return CommandResult.failure<PickupReservation>(
          "Validation failed",
          errors,
        );
      }

      const reservation = await this.reservationService.extendReservation(
        command.reservationId,
        command.additionalMinutes,
      );

      return CommandResult.success(reservation);
    } catch (error) {
      return CommandResult.failure<PickupReservation>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
