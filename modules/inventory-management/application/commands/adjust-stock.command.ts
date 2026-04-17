import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface AdjustStockCommand extends ICommand {
  readonly variantId: string;
  readonly locationId: string;
  readonly quantityDelta: number;
  readonly reason: string;
  readonly referenceId?: string;
}

export class AdjustStockHandler implements ICommandHandler<
  AdjustStockCommand,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: AdjustStockCommand): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.adjustStock(
      command.variantId,
      command.locationId,
      command.quantityDelta,
      command.reason,
      command.referenceId,
    );
    return CommandResult.success(stock);
  }
}
