import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { Category } from "../../../domain/entities/category.entity";
import { CategoryManagementService } from "../../services/category-management.service";
import { UpdateCategoryCommand } from "./update-category.command";

export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand, CommandResult<Category>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: UpdateCategoryCommand): Promise<CommandResult<Category>> {
    try {
      const updateData = {
        name: command.name,
        slug: command.slug,
        parentId: command.parentId,
        position: command.position,
      };

      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );

      const category = await this.categoryManagementService.updateCategory(
        command.categoryId,
        filteredUpdateData,
      );

      if (!category) {
        return CommandResult.failure<Category>("Category not found");
      }

      return CommandResult.success<Category>(category);
    } catch (error) {
      return CommandResult.failure<Category>(
        error instanceof Error ? error.message : "Category update failed",
      );
    }
  }
}
