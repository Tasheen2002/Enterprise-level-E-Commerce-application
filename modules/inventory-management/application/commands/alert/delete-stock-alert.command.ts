import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockAlertService } from "../../services/stock-alert.service";

export interface DeleteStockAlertInput extends ICommand {
  alertId: string;
}

export class DeleteStockAlertHandler implements ICommandHandler<
  DeleteStockAlertInput,
  CommandResult<void>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(input: DeleteStockAlertInput): Promise<CommandResult<void>> {
    await this.stockAlertService.deleteStockAlert(input.alertId);
    return CommandResult.success();
  }
}
