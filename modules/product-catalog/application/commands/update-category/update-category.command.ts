import { ICommand } from "@/api/src/shared/application";

export interface UpdateCategoryCommand extends ICommand {
  categoryId: string;
  name?: string;
  slug?: string;
  parentId?: string;
  position?: number;
}
