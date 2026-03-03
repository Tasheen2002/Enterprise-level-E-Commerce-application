import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import {
  ReservationService,
  ReservationDto,
} from "../services/reservation.service";

export interface CreateReservationCommand extends ICommand {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}

export class CreateReservationHandler
  implements
    ICommandHandler<CreateReservationCommand, CommandResult<ReservationDto>>
{
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    command: CreateReservationCommand,
  ): Promise<CommandResult<ReservationDto>> {
    try {
      const errors: string[] = [];

      if (!command.cartId || command.cartId.trim().length === 0) {
        errors.push("cartId: Cart ID is required");
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.quantity || command.quantity <= 0) {
        errors.push("quantity: Quantity must be greater than 0");
      }

      if (errors.length > 0) {
        return CommandResult.failure<ReservationDto>("Validation failed", errors);
      }

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
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
