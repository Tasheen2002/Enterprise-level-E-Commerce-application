import { ICommand } from "@/api/src/shared/application";

export interface CreateBackorderCommand extends ICommand {
  orderItemId: string;
  promisedEta?: Date;
}
