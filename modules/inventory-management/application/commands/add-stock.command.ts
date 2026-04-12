import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface AddStockCommand extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: string;
}

export class AddStockHandler implements ICommandHandler<
  AddStockCommand,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AddStockCommand): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.addStock(
      command.variantId,
      command.locationId,
      command.quantity,
      command.reason,
    );
    return CommandResult.success(stock);
  }
}
