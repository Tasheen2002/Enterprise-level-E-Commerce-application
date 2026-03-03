import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CreatePickupReservationCommand } from "./create-pickup-reservation.command";
import { PickupReservationService } from "../../services/pickup-reservation.service";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";

export class CreatePickupReservationHandler implements ICommandHandler<
  CreatePickupReservationCommand,
  CommandResult<PickupReservation>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: CreatePickupReservationCommand,
  ): Promise<CommandResult<PickupReservation>> {
    try {
      const reservation = await this.reservationService.createPickupReservation(
        command.orderId,
        command.variantId,
        command.locationId,
        command.qty,
        command.expirationMinutes,
      );

      return CommandResult.success(reservation);
    } catch (error) {
      return CommandResult.failure<PickupReservation>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
