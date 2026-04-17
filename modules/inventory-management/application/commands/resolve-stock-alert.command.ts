import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../services/stock-alert.service";

export interface ResolveStockAlertCommand extends ICommand {
  readonly alertId: string;
}

export class ResolveStockAlertHandler implements ICommandHandler<
  ResolveStockAlertCommand,
  CommandResult<StockAlertDTO>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(command: ResolveStockAlertCommand): Promise<CommandResult<StockAlertDTO>> {
    const alert = await this.stockAlertService.resolveStockAlert(command.alertId);
    return CommandResult.success(alert);
  }
}
