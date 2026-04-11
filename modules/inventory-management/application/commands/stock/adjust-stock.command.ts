import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface AdjustStockInput extends ICommand {
  variantId: string;
  locationId: string;
  quantityDelta: number;
  reason: string;
  referenceId?: string;
}

export class AdjustStockHandler implements ICommandHandler<
  AdjustStockInput,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: AdjustStockInput): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.adjustStock(
      input.variantId,
      input.locationId,
      input.quantityDelta,
      input.reason,
      input.referenceId,
    );
    return CommandResult.success(stock);
  }
}
