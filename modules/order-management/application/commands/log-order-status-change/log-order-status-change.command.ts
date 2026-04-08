import { ICommand } from "@/api/src/shared/application";

export interface LogOrderStatusChangeCommand extends ICommand {
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
}
