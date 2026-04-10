import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../services/category-management.service";

export interface ReorderCategoriesInput extends ICommand {
  categoryOrders: Array<{ id: string; position: number }>;
}

export class ReorderCategoriesHandler implements ICommandHandler<ReorderCategoriesInput, CommandResult<void>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: ReorderCategoriesInput): Promise<CommandResult<void>> {
    await this.categoryManagementService.reorderCategories(input.categoryOrders);
    return CommandResult.success(undefined);
  }
}
