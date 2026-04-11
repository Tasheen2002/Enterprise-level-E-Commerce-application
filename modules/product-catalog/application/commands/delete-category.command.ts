import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../services/category-management.service";

export interface DeleteCategoryInput extends ICommand {
  categoryId: string;
}

export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryInput, CommandResult<void>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: DeleteCategoryInput): Promise<CommandResult<void>> {
    await this.categoryManagementService.deleteCategory(input.categoryId);
    return CommandResult.success(undefined);
  }
}
