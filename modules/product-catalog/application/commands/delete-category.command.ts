import { CategoryManagementService } from "../services/category-management.service";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface DeleteCategoryCommand extends ICommand {
  categoryId: string;
}

export class DeleteCategoryHandler implements ICommandHandler<
  DeleteCategoryCommand,
  CommandResult<boolean>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    command: DeleteCategoryCommand,
  ): Promise<CommandResult<boolean>> {
    try {
      if (!command.categoryId) {
        return CommandResult.failure<boolean>("Category ID is required", [
          "categoryId",
        ]);
      }

      await this.categoryManagementService.deleteCategory(command.categoryId);
      return CommandResult.success<boolean>(true);
    } catch (error) {
      if (error instanceof Error) {
        return CommandResult.failure<boolean>("Category deletion failed", [
          error.message,
        ]);
      }

      return CommandResult.failure<boolean>(
        "An unexpected error occurred during category deletion",
      );
    }
  }
}
