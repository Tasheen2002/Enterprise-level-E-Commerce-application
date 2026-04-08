import { ICommand } from "@/api/src/shared/application";

export interface CancelOrderCommand extends ICommand {
  orderId: string;
}
