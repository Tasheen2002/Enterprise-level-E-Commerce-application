import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface UpdateCategoryInput extends ICommand {
  categoryId: string;
  name?: string;
  slug?: string;
  parentId?: string;
  position?: number;
}

export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryInput, CommandResult<CategoryDTO>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: UpdateCategoryInput): Promise<CommandResult<CategoryDTO>> {
    const { categoryId, ...updates } = input;
    const dto = await this.categoryManagementService.updateCategory(categoryId, updates);
    return CommandResult.success(dto);
  }
}
