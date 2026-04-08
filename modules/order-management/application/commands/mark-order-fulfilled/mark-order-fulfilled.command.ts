import { ICommand } from "@/api/src/shared/application";

export interface MarkOrderAsFulfilledCommand extends ICommand {
  orderId: string;
}
