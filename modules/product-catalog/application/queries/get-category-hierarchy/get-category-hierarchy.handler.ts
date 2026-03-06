import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  CategoryManagementService,
  CategoryTreeNode,
} from "../../services/category-management.service";
import { GetCategoryHierarchyQuery } from "./get-category-hierarchy.query";

export class GetCategoryHierarchyHandler implements IQueryHandler<
  GetCategoryHierarchyQuery,
  QueryResult<CategoryTreeNode[]>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(
    _query: GetCategoryHierarchyQuery,
  ): Promise<QueryResult<CategoryTreeNode[]>> {
    try {
      const hierarchy =
        await this.categoryManagementService.getCategoryHierarchy();
      return QueryResult.success<CategoryTreeNode[]>(hierarchy);
    } catch (error) {
      return QueryResult.failure<CategoryTreeNode[]>(
        error instanceof Error
          ? error.message
          : "Failed to get category hierarchy",
      );
    }
  }
}
