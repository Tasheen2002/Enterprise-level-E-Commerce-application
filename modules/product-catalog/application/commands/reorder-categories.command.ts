import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CategoryManagementService } from "../services/category-management.service";

export interface ReorderCategoriesCommand extends ICommand {
  readonly categoryOrders: Array<{ id: string; position: number }>;
}

export class ReorderCategoriesHandler implements ICommandHandler<ReorderCategoriesCommand, CommandResult<void>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: ReorderCategoriesCommand): Promise<CommandResult<void>> {
    await this.categoryManagementService.reorderCategories(command.categoryOrders);
    return CommandResult.success(undefined);
  }
}
