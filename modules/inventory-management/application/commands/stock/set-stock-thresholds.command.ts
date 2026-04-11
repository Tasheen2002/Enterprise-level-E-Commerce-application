import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockDTO } from "../../../domain/entities/stock.entity";
import { StockManagementService } from "../../services/stock-management.service";

export interface SetStockThresholdsInput extends ICommand {
  variantId: string;
  locationId: string;
  lowStockThreshold?: number;
  safetyStock?: number;
}

export class SetStockThresholdsHandler implements ICommandHandler<
  SetStockThresholdsInput,
  CommandResult<StockDTO>
> {
  constructor(private readonly stockService: StockManagementService) {}

  async handle(input: SetStockThresholdsInput): Promise<CommandResult<StockDTO>> {
    const stock = await this.stockService.setStockThresholds(
      input.variantId,
      input.locationId,
      input.lowStockThreshold,
      input.safetyStock,
    );
    return CommandResult.success(stock);
  }
}
