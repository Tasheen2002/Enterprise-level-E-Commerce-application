import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockAlertService } from "../services/stock-alert.service";

export interface DeleteStockAlertCommand extends ICommand {
  readonly alertId: string;
}

export class DeleteStockAlertHandler implements ICommandHandler<
  DeleteStockAlertCommand,
  CommandResult<void>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(command: DeleteStockAlertCommand): Promise<CommandResult<void>> {
    await this.stockAlertService.deleteStockAlert(command.alertId);
    return CommandResult.success();
  }
}
