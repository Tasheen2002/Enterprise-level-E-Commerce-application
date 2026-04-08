import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../../services/category-management.service";
import { ReorderCategoriesCommand } from "./reorder-categories.command";

export class ReorderCategoriesHandler implements ICommandHandler<
  ReorderCategoriesCommand,
  CommandResult<void>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    command: ReorderCategoriesCommand,
  ): Promise<CommandResult<void>> {
    try {
      await this.categoryManagementService.reorderCategories(
        command.categoryOrders,
      );
      return CommandResult.success<void>(undefined);
    } catch (error) {
      return CommandResult.failure<void>(
        error instanceof Error ? error.message : "Failed to reorder categories",
      );
    }
  }
}
