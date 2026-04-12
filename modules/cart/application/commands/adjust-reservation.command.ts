import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { ReservationService, ReservationDto } from "../services/reservation.service";

export interface AdjustReservationCommand extends ICommand {
  cartId: string;
  variantId: string;
  newQuantity: number;
}

export class AdjustReservationHandler implements ICommandHandler<AdjustReservationCommand, CommandResult<ReservationDto | null>> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(command: AdjustReservationCommand): Promise<CommandResult<ReservationDto | null>> {
    const reservation = await this.reservationService.adjustReservation({
      cartId: command.cartId,
      variantId: command.variantId,
      newQuantity: command.newQuantity,
    });
    return CommandResult.success<ReservationDto | null>(reservation);
  }
}
