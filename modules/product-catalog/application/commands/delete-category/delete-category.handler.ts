import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../../services/category-management.service";
import { DeleteCategoryCommand } from "./delete-category.command";

export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, CommandResult<boolean>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: DeleteCategoryCommand): Promise<CommandResult<boolean>> {
    try {
      await this.categoryManagementService.deleteCategory(command.categoryId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      return CommandResult.failure<boolean>(
        error instanceof Error ? error.message : "Category deletion failed",
      );
    }
  }
}
