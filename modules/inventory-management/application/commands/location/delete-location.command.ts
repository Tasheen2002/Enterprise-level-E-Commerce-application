import { ICommand } from "@/api/src/shared/application";

export interface DeleteLocationCommand extends ICommand {
  locationId: string;
}
