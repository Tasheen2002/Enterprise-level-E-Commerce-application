import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CategoryManagementService } from "../services/category-management.service";

export interface DeleteCategoryCommand extends ICommand {
  readonly categoryId: string;
}

export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, CommandResult<void>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: DeleteCategoryCommand): Promise<CommandResult<void>> {
    await this.categoryManagementService.deleteCategory(command.categoryId);
    return CommandResult.success(undefined);
  }
}
