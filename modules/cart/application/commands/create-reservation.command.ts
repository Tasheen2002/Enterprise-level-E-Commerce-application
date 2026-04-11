import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface CreateReservationCommand extends ICommand {
  cartId: string;
  variantId: string;
  quantity: number;
  durationMinutes?: number;
}

export class CreateReservationHandler implements ICommandHandler<CreateReservationCommand, CommandResult<ReservationDto>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: CreateReservationCommand): Promise<CommandResult<ReservationDto>> {
    const reservation = await this.reservationService.createReservation({
      cartId: command.cartId,
      variantId: command.variantId,
      quantity: command.quantity,
      durationMinutes: command.durationMinutes,
    });
    return CommandResult.success<ReservationDto>(reservation);
  }
}
