import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ReservationService, ReservationDto } from "../../services/reservation.service";
import { CreateReservationCommand } from "./create-reservation.command";

export class CreateReservationHandler
  implements ICommandHandler<CreateReservationCommand, CommandResult<ReservationDto>>
{
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: CreateReservationCommand): Promise<CommandResult<ReservationDto>> {
    try {
      const reservation = await this.reservationService.createReservation({
        cartId: command.cartId,
        variantId: command.variantId,
        quantity: command.quantity,
        durationMinutes: command.durationMinutes,
      });
      return CommandResult.success<ReservationDto>(reservation);
    } catch (error) {
      return CommandResult.failure<ReservationDto>(
        error instanceof Error ? error.message : "Failed to create reservation",
      );
    }
  }
}
