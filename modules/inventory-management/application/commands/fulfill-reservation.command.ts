import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface FulfillReservationCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
}

export class FulfillReservationHandler implements ICommandHandler<
  FulfillReservationCommand,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: FulfillReservationCommand): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.fulfillReservation(
      command.variantId,
      command.locationId,
      command.quantity,
    );
    return CommandResult.success(stock);
  }
}
