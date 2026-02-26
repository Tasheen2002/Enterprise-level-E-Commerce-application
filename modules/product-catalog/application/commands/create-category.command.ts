import { CategoryManagementService } from "../services/category-management.service";
import { Category } from "../../domain/entities/category.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface CreateCategoryCommand extends ICommand {
  name: string;
  slug?: string;
  parentId?: string;
  position?: number;
}

export class CreateCategoryHandler implements ICommandHandler<
  CreateCategoryCommand,
  CommandResult<Category>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    command: CreateCategoryCommand,
  ): Promise<CommandResult<Category>> {
    try {
      if (!command.name) {
        return CommandResult.failure<Category>("Category name is required", [
          "name",
        ]);
      }

      const categoryData = {
        name: command.name,
        slug: command.slug,
        parentId: command.parentId,
        position: command.position,
      };

      const category =
        await this.categoryManagementService.createCategory(categoryData);
      return CommandResult.success<Category>(category);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<Category>("Category creation failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<Category>(
        "An unexpected error occurred during category creation",
      );
    }
  }
}
