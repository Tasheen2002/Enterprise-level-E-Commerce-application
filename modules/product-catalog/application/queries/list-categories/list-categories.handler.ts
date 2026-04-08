import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../../services/category-management.service";
import { ListCategoriesQuery } from "./list-categories.query";
import { CategoryData } from "../../../domain/entities/category.entity";

export interface ListCategoriesResult {
  categories: CategoryData[];
  meta: {
    page: number;
    limit: number;
    parentId: string | null;
    includeChildren: boolean;
    sortBy: string;
    sortOrder: string;
  };
}

export class ListCategoriesHandler implements IQueryHandler<
  ListCategoriesQuery,
  QueryResult<ListCategoriesResult>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    query: ListCategoriesQuery,
  ): Promise<QueryResult<ListCategoriesResult>> {
    try {
      const options = {
        page: Math.max(1, query.page ?? 1),
        limit: Math.min(100, Math.max(1, query.limit ?? 50)),
        parentId: query.parentId,
        includeChildren: query.includeChildren ?? false,
        sortBy: query.sortBy ?? ("position" as const),
        sortOrder: query.sortOrder ?? ("asc" as const),
      };

      const categories =
        await this.categoryManagementService.getCategories(options);
      const mappedData = categories.map((category) => category.toData());

      return QueryResult.success<ListCategoriesResult>({
        categories: mappedData,
        meta: {
          page: options.page,
          limit: options.limit,
          parentId: options.parentId || null,
          includeChildren: options.includeChildren,
          sortBy: options.sortBy,
          sortOrder: options.sortOrder,
        },
      });
    } catch (error) {
      return QueryResult.failure<ListCategoriesResult>(
        error instanceof Error ? error.message : "Failed to list categories",
      );
    }
  }
}
