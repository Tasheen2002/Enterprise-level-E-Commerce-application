import { ICommand } from "@/api/src/shared/application";

export interface MarkPreorderNotifiedCommand extends ICommand {
  orderItemId: string;
}
