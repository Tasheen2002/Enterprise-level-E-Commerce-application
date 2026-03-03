import { ICommand } from "@/api/src/shared/application";

export interface UpdatePOStatusCommand extends ICommand {
  poId: string;
  status: string;
}
