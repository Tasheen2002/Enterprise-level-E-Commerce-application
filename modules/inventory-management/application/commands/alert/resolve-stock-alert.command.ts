import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { StockAlertDTO } from "../../../domain/entities/stock-alert.entity";
import { StockAlertService } from "../../services/stock-alert.service";

export interface ResolveStockAlertInput extends ICommand {
  alertId: string;
}

export class ResolveStockAlertHandler implements ICommandHandler<
  ResolveStockAlertInput,
  CommandResult<StockAlertDTO>
> {
  constructor(private readonly stockAlertService: StockAlertService) {}

  async handle(input: ResolveStockAlertInput): Promise<CommandResult<StockAlertDTO>> {
    const alert = await this.stockAlertService.resolveStockAlert(input.alertId);
    return CommandResult.success(alert);
  }
}
