import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockAlertDTO } from "../../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../../services/stock-alert.service";

export interface CreateStockAlertInput extends ICommand {
  variantId: string;
  type: string;
}

export class CreateStockAlertHandler implements ICommandHandler<
  CreateStockAlertInput,
  CommandResult<StockAlertDTO>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(input: CreateStockAlertInput): Promise<CommandResult<StockAlertDTO>> {
    const alert = await this.stockAlertService.createStockAlert(
      input.variantId,
      input.type,
    );
    return CommandResult.success(alert);
  }
}
