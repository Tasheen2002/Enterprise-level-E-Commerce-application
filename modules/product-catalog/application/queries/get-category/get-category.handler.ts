import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CategoryManagementService } from "../../services/category-management.service";
import { GetCategoryQuery } from "./get-category.query";
import { CategoryData } from "../../../domain/entities/category.entity";

export class GetCategoryHandler implements IQueryHandler<
  GetCategoryQuery,
  QueryResult<CategoryData>
> {
  constructor(
    private readonly categoryManagementService: CategoryManagementService,
  ) {}

  async handle(query: GetCategoryQuery): Promise<QueryResult<CategoryData>> {
    try {
      let category;
      if (query.categoryId) {
        category = await this.categoryManagementService.getCategoryById(
          query.categoryId,
        );
      } else if (query.slug) {
        category = await this.categoryManagementService.getCategoryBySlug(
          query.slug,
        );
      }

      if (!category) {
        return QueryResult.failure<CategoryData>("Category not found");
      }

      return QueryResult.success<CategoryData>(category.toData());
    } catch (error) {
      return QueryResult.failure<CategoryData>(
        error instanceof Error ? error.message : "Failed to get category",
      );
    }
  }
}
