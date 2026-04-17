import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";
import { DomainValidationError } from "../../domain/errors/product-catalog.errors";

export interface GetCategoryQuery extends IQuery {
  readonly categoryId?: string;
  readonly slug?: string;
}

export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery, CategoryDTO> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: GetCategoryQuery): Promise<CategoryDTO> {
    if (!input.categoryId && !input.slug) {
      throw new DomainValidationError("Either categoryId or slug is required");
    }
    if (input.categoryId) {
      return this.categoryManagementService.getCategoryById(input.categoryId);
    }
    return this.categoryManagementService.getCategoryBySlug(input.slug!);
  }
}
