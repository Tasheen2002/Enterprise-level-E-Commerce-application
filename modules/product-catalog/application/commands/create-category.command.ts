import { ICommand, ICommandHandler, CommandResult } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface CreateCategoryCommand extends ICommand {
  readonly name: string;
  readonly slug?: string;
  readonly parentId?: string;
  readonly position?: number;
}

export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand, CommandResult<CategoryDTO>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(command: CreateCategoryCommand): Promise<CommandResult<CategoryDTO>> {
    const dto = await this.categoryManagementService.createCategory(command);
    return CommandResult.success(dto);
  }
}
