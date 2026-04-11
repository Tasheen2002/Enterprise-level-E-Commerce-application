import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface AddStockInput extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
  reason: string;
}

export class AddStockHandler implements ICommandHandler<
  AddStockInput,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: AddStockInput): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.addStock(
      input.variantId,
      input.locationId,
      input.quantity,
      input.reason,
    );
    return CommandResult.success(stock);
  }
}
