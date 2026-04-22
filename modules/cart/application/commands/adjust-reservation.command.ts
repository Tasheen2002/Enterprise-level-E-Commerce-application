import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  ReservationService,
  ReservationDto,
} from "../services/reservation.service";

export interface AdjustReservationCommand extends ICommand {
  readonly cartId: string;
  readonly variantId: string;
  readonly newQuantity: number;
}

export class AdjustReservationHandler implements ICommandHandler<
  AdjustReservationCommand,
  CommandResult<ReservationDto | undefined>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    command: AdjustReservationCommand,
  ): Promise<CommandResult<ReservationDto | undefined>> {
    const reservation = await this.reservationService.adjustReservation({
      cartId: command.cartId,
      variantId: command.variantId,
      newQuantity: command.newQuantity,
    });
    return CommandResult.success<ReservationDto | undefined>(reservation ?? undefined);
  }
}
