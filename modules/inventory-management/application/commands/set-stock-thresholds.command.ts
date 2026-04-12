import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface SetStockThresholdsCommand extends ICommand {
  variantId: string;
  locationId: string;
  lowStockThreshold?: number;
  safetyStock?: number;
}

export class SetStockThresholdsHandler implements ICommandHandler<
  SetStockThresholdsCommand,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: SetStockThresholdsCommand): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.setStockThresholds(
      command.variantId,
      command.locationId,
      command.lowStockThreshold,
      command.safetyStock,
    );
    return CommandResult.success(stock);
  }
}
