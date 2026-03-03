import { ICommand } from "@/api/src/shared/application";

export interface UpdateOrderStatusCommand extends ICommand {
  orderId: string;
  status: string;
}
