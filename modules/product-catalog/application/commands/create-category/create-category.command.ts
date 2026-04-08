import { ICommand } from "@/api/src/shared/application";

export interface CreateCategoryCommand extends ICommand {
  name: string;
  slug?: string;
  parentId?: string;
  position?: number;
}
