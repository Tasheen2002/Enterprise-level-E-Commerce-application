import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { PickupReservationDTO } from "../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../services/pickup-reservation.service";

export interface CreatePickupReservationCommand extends ICommand {
  readonly orderId: string;
  readonly variantId: string;
  readonly locationId: string;
  readonly qty: number;
  readonly expirationMinutes?: number;
}

export class CreatePickupReservationHandler implements ICommandHandler<
  CreatePickupReservationCommand,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(command: CreatePickupReservationCommand): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.createPickupReservation(
      command.orderId,
      command.variantId,
      command.locationId,
      command.qty,
      command.expirationMinutes,
    );
    return CommandResult.success(reservation);
  }
}
