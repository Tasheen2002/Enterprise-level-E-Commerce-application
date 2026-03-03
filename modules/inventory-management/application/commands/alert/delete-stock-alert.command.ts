import { ICommand } from "@/api/src/shared/application";

export interface DeleteStockAlertCommand extends ICommand {
  alertId: string;
}
