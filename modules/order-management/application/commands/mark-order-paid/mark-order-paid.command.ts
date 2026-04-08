import { ICommand } from "@/api/src/shared/application";

export interface MarkOrderAsPaidCommand extends ICommand {
  orderId: string;
}
