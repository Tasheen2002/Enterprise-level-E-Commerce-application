import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";
import { PickupReservationService } from "../../services/pickup-reservation.service";
import { PickupReservation } from "../../../domain/entities/pickup-reservation.entity";

export interface CreatePickupReservationCommand extends ICommand {
  orderId: string;
  variantId: string;
  locationId: string;
  qty: number;
  expirationMinutes?: number;
}

export class CreatePickupReservationHandler implements ICommandHandler<
  CreatePickupReservationCommand,
  CommandResult<PickupReservation>
> {
  constructor(private readonly reservationService: PickupReservationService) {}

  async handle(
    command: CreatePickupReservationCommand,
  ): Promise<CommandResult<PickupReservation>> {
    try {
      const errors: string[] = [];

      if (!command.orderId || command.orderId.trim().length === 0) {
        errors.push("orderId: Order ID is required");
      }

      if (!command.variantId || command.variantId.trim().length === 0) {
        errors.push("variantId: Variant ID is required");
      }

      if (!command.locationId || command.locationId.trim().length === 0) {
        errors.push("locationId: Location ID is required");
      }

      if (!command.qty || command.qty <= 0) {
        errors.push("qty: Quantity must be greater than 0");
      }

      if (
        command.expirationMinutes !== undefined &&
        command.expirationMinutes <= 0
      ) {
        errors.push(
          "expirationMinutes: Expiration minutes must be greater than 0",
        );
      }

      if (errors.length > 0) {
        return CommandResult.failure<PickupReservation>(
          "Validation failed",
          errors,
        );
      }

      const reservation = await this.reservationService.createPickupReservation(
        command.orderId,
        command.variantId,
        command.locationId,
        command.qty,
        command.expirationMinutes,
      );

      return CommandResult.success(reservation);
    } catch (error) {
      return CommandResult.failure<PickupReservation>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

