import { ICommand } from "@/api/src/shared/application";

export interface MarkBackorderNotifiedCommand extends ICommand {
  orderItemId: string;
}
