import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface ReserveStockInput extends ICommand {
  variantId: string;
  locationId: string;
  quantity: number;
}

export class ReserveStockHandler implements ICommandHandler<
  ReserveStockInput,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: ReserveStockInput): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.reserveStock(
      input.variantId,
      input.locationId,
      input.quantity,
    );
    return CommandResult.success(stock);
  }
}
