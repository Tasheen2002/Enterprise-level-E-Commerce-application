import { ICommand } from "@/api/src/shared/application";

export interface CreatePreorderCommand extends ICommand {
  orderItemId: string;
  releaseDate?: Date;
}
