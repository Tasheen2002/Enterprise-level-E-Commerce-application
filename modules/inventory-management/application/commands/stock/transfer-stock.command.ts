import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface TransferStockInput extends ICommand {
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
  TransferStockInput,
  CommandResult<TransferStockResult>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: TransferStockInput): Promise<CommandResult<TransferStockResult>> {
    const result = await this.stockService.transferStock(
      input.variantId,
      input.fromLocationId,
      input.toLocationId,
      input.quantity,
    );
    return CommandResult.success(result);
  }
}
