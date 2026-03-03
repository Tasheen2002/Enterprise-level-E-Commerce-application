import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ExtendReservationCommand } from "./extend-reservation.command";
import { PickupReservationService } from "../../services/pickup-reservation.service";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";

export class ExtendReservationHandler implements ICommandHandler<
  ExtendReservationCommand,
  CommandResult<PickupReservation>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: ExtendReservationCommand,
  ): Promise<CommandResult<PickupReservation>> {
    try {
      const reservation = await this.reservationService.extendReservation(
        command.reservationId,
        command.additionalMinutes,
      );

      return CommandResult.success(reservation);
    } catch (error) {
      return CommandResult.failure<PickupReservation>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
