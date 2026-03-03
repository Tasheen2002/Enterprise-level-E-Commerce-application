import { ICommand } from "@/api/src/shared/application";

export interface UpdateBackorderEtaCommand extends ICommand {
  orderItemId: string;
  promisedEta: Date;
}
