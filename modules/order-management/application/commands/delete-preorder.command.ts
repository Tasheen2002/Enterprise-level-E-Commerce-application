import { ICommand } from "@/api/src/shared/application";

export interface DeletePreorderCommand extends ICommand {
  orderItemId: string;
}
