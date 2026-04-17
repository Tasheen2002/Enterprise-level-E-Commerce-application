import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface ReserveStockCommand extends ICommand {
  readonly variantId: string;
  readonly locationId: string;
  readonly quantity: number;
}

export class ReserveStockHandler implements ICommandHandler<
  ReserveStockCommand,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: ReserveStockCommand): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.reserveStock(
      command.variantId,
      command.locationId,
      command.quantity,
    );
    return CommandResult.success(stock);
  }
}
