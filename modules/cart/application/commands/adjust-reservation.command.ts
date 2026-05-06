import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  ReservationService,
  ReservationDTO,
} from "../services/reservation.service";

export interface AdjustReservationCommand extends ICommand {
  readonly cartId: string;
  readonly variantId: string;
  readonly newQuantity: number;
}

export class AdjustReservationHandler implements ICommandHandler<
  AdjustReservationCommand,
  CommandResult<ReservationDTO | undefined>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    command: AdjustReservationCommand,
  ): Promise<CommandResult<ReservationDTO | undefined>> {
    const reservation = await this.reservationService.adjustReservation({
      cartId: command.cartId,
      variantId: command.variantId,
      newQuantity: command.newQuantity,
    });
    return CommandResult.success<ReservationDTO | undefined>(reservation ?? undefined);
  }
}
