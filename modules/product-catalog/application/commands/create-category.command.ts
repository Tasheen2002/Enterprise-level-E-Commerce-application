import { ICommand, ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface CreateCategoryInput extends ICommand {
  name: string;
  slug?: string;
  parentId?: string;
  position?: number;
}

export class CreateCategoryHandler implements ICommandHandler<CreateCategoryInput, CommandResult<CategoryDTO>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: CreateCategoryInput): Promise<CommandResult<CategoryDTO>> {
    const dto = await this.categoryManagementService.createCategory(input);
    return CommandResult.success(dto);
  }
}
