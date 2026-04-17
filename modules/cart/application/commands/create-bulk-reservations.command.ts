import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "../../../../packages/core/src/application/cqrs";
import {
  ReservationService,
  BulkReservationResultDto,
} from "../services/reservation.service";

export interface CreateBulkReservationsCommand extends ICommand {
  readonly cartId: string;
  readonly items: Array<{ variantId: string; quantity: number }>;
  readonly durationMinutes?: number;
}

export class CreateBulkReservationsHandler implements ICommandHandler<
  CreateBulkReservationsCommand,
  CommandResult<BulkReservationResultDto>
> {
  constructor(private readonly reservationService: ReservationService) {}

  async handle(
    command: CreateBulkReservationsCommand,
  ): Promise<CommandResult<BulkReservationResultDto>> {
    const result = await this.reservationService.createBulkReservations({
      cartId: command.cartId,
      items: command.items,
      durationMinutes: command.durationMinutes,
    });
    return CommandResult.success<BulkReservationResultDto>(result);
  }
}
