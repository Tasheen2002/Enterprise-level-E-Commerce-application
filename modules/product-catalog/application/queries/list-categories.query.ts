import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface ListCategoriesQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly parentId?: string;
  readonly includeChildren?: boolean;
  readonly sortBy?: "name" | "position";
  readonly sortOrder?: "asc" | "desc";
}

export interface ListCategoriesResult {
  readonly categories: CategoryDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery, ListCategoriesResult> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: ListCategoriesQuery): Promise<ListCategoriesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const sortBy = input.sortBy ?? "position";
    const sortOrder = input.sortOrder ?? "asc";
    const includeChildren = input.includeChildren ?? false;

    const result = await this.categoryManagementService.getCategories({
      page, limit, parentId: input.parentId, includeChildren, sortBy, sortOrder,
    });

    return {
      categories: result.categories,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}
