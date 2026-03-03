import { ICommand } from "@/api/src/shared/application";

export interface UpdatePreorderReleaseDateCommand extends ICommand {
  orderItemId: string;
  releaseDate: Date;
}
