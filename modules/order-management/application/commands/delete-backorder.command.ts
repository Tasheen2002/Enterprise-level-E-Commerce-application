import { ICommand } from "@/api/src/shared/application";

export interface DeleteBackorderCommand extends ICommand {
  orderItemId: string;
}
