import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { Category } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";
import { CreateCategoryCommand } from "./create-category.command";

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
      const category = await this.categoryManagementService.createCategory({
        name: command.name,
        parentId: command.parentId,
        position: command.position,
      });
      return CommandResult.success<Category>(category);
    } catch (error) {
      return CommandResult.failure<Category>(
        error instanceof Error ? error.message : "Category creation failed",
      );
    }
  }
}
