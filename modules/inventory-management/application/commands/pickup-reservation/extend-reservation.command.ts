import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { PickupReservationDTO } from "../../../domain/entities/pickup-reservation.entity";
import { PickupReservationService } from "../../services/pickup-reservation.service";

export interface ExtendReservationInput extends ICommand {
  reservationId: string;
  additionalMinutes: number;
}

export class ExtendReservationHandler implements ICommandHandler<
  ExtendReservationInput,
  CommandResult<PickupReservationDTO>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(input: ExtendReservationInput): Promise<CommandResult<PickupReservationDTO>> {
    const reservation = await this.reservationService.extendReservation(
      input.reservationId,
      input.additionalMinutes,
    );
    return CommandResult.success(reservation);
  }
}
