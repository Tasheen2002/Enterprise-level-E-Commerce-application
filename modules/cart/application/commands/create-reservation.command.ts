import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  ReservationService,
  ReservationDTO,
} from "../services/reservation.service";

export interface CreateReservationCommand extends ICommand {
  readonly cartId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly durationMinutes?: number;
}

export class CreateReservationHandler implements ICommandHandler<
  CreateReservationCommand,
  CommandResult<ReservationDTO>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    command: CreateReservationCommand,
  ): Promise<CommandResult<ReservationDTO>> {
    const reservation = await this.reservationService.createReservation({
      cartId: command.cartId,
      variantId: command.variantId,
      quantity: command.quantity,
      durationMinutes: command.durationMinutes,
    });
    return CommandResult.success<ReservationDTO>(reservation);
  }
}
