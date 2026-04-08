import { ICommand } from "@/api/src/shared/application";

export interface DeleteOrderCommand extends ICommand {
  orderId: string;
}
