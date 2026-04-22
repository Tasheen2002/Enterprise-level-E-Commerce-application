import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface UpdateCategoryCommand extends ICommand {
  readonly categoryId: string;
  readonly name?: string;
  readonly slug?: string;
  readonly parentId?: string | null;
  readonly position?: number;
}

export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand, CommandResult<CategoryDTO>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: UpdateCategoryCommand): Promise<CommandResult<CategoryDTO>> {
    const { categoryId, ...updates } = command;
    const dto = await this.categoryManagementService.updateCategory(categoryId, updates);
    return CommandResult.success(dto);
  }
}
