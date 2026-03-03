import { ICommand } from "@/api/src/shared/application";

export interface DeleteCategoryCommand extends ICommand {
  categoryId: string;
}
