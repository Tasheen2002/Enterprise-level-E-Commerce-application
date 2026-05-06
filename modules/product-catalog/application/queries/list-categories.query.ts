import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface ListCategoriesQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly parentId?: string;
  readonly includeChildren?: boolean;
  readonly sortBy?: "name" | "position";
  readonly sortOrder?: "asc" | "desc";
}

export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery, PaginatedResult<CategoryDTO>> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(query: ListCategoriesQuery): Promise<PaginatedResult<CategoryDTO>> {
    return this.categoryManagementService.getCategories({
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      parentId: query.parentId,
      includeChildren: query.includeChildren,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}
