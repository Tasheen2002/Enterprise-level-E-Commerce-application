import { CategoryManagementService } from "../services/category-management.service";
import { Category } from "../../domain/entities/category.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface UpdateCategoryCommand extends ICommand {
  categoryId: string;
  name?: string;
  slug?: string;
  parentId?: string;
  position?: number;
}

export class UpdateCategoryHandler implements ICommandHandler<
  UpdateCategoryCommand,
  CommandResult<Category>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    command: UpdateCategoryCommand,
  ): Promise<CommandResult<Category>> {
    try {
      if (!command.categoryId) {
        return CommandResult.failure<Category>("Category ID is required", [
          "categoryId",
        ]);
      }

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
      if (error instanceof Error) {
        return CommandResult.failure<Category>("Category update failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<Category>(
        "An unexpected error occurred during category update",
      );
    }
  }
}
