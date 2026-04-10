import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { CategoryManagementService, CategoryTreeNode } from "../services/category-management.service";

export interface GetCategoryHierarchyInput extends IQuery {}

export class GetCategoryHierarchyHandler implements IQueryHandler<GetCategoryHierarchyInput, CategoryTreeNode[]> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(_input: GetCategoryHierarchyInput): Promise<CategoryTreeNode[]> {
    return this.categoryManagementService.getCategoryHierarchy();
  }
}
