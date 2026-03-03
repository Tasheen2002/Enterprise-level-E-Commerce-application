import { ICommand } from "@/api/src/shared/application";

export interface UpdatePOEtaCommand extends ICommand {
  poId: string;
  eta: Date;
}
