import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CategoryManagementService, CategoryTreeNode } from "../services/category-management.service";

export interface GetCategoryHierarchyQuery extends IQuery {}

export class GetCategoryHierarchyHandler implements IQueryHandler<GetCategoryHierarchyQuery, CategoryTreeNode[]> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(query: GetCategoryHierarchyQuery): Promise<CategoryTreeNode[]> {
    return this.categoryManagementService.getCategoryHierarchy();
  }
}
