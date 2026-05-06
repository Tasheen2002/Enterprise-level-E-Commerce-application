import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";
import { MissingCategoryIdentifierError } from "../../domain/errors/product-catalog.errors";

export interface GetCategoryQuery extends IQuery {
  readonly categoryId?: string;
  readonly slug?: string;
}

export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery, CategoryDTO> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(query: GetCategoryQuery): Promise<CategoryDTO> {
    if (query.categoryId) {
      return this.categoryManagementService.getCategoryById(query.categoryId);
    }
    if (query.slug) {
      return this.categoryManagementService.getCategoryBySlug(query.slug);
    }
    throw new MissingCategoryIdentifierError();
  }
}
