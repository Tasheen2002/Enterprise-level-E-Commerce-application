import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { StockAlertDTO } from "../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../services/stock-alert.service";

export interface CreateStockAlertCommand extends ICommand {
  readonly variantId: string;
  readonly type: string;
}

export class CreateStockAlertHandler implements ICommandHandler<
  CreateStockAlertCommand,
  CommandResult<StockAlertDTO>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(command: CreateStockAlertCommand): Promise<CommandResult<StockAlertDTO>> {
    const alert = await this.stockAlertService.createStockAlert(
      command.variantId,
      command.type,
    );
    return CommandResult.success(alert);
  }
}
