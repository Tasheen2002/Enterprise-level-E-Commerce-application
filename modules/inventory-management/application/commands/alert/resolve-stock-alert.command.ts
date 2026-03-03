import { ICommand } from "@/api/src/shared/application";

export interface ResolveStockAlertCommand extends ICommand {
  alertId: string;
}
