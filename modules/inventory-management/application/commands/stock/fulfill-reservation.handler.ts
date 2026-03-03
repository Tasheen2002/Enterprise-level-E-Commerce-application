import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockManagementService } from "../../services/stock-management.service";
import { Stock } from "../../../domain/entities/stock.entity";
import { FulfillReservationCommand } from "./fulfill-reservation.command";

export class FulfillReservationHandler implements ICommandHandler<
  FulfillReservationCommand,
  CommandResult<Stock>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(
    command: FulfillReservationCommand,
  ): Promise<CommandResult<Stock>> {
    try {
      const stock = await this.stockService.fulfillReservation(
        command.variantId,
        command.locationId,
        command.quantity,
      );

      return CommandResult.success(stock);
    } catch (error) {
      return CommandResult.failure<Stock>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
