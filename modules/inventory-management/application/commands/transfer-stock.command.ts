import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockDTO } from "../../domain/entities/stock.entity";
import { StockManagementService } from "../services/stock-management.service";

export interface TransferStockCommand extends ICommand {
  variantId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface TransferStockResult {
  fromStock: StockDTO;
  toStock: StockDTO;
}

export class TransferStockHandler implements ICommandHandler<
  TransferStockCommand,
  CommandResult<TransferStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(command: TransferStockCommand): Promise<CommandResult<TransferStockResult>> {
    const result = await this.stockService.transferStock(
      command.variantId,
      command.fromLocationId,
      command.toLocationId,
      command.quantity,
    );
    return CommandResult.success(result);
  }
}
