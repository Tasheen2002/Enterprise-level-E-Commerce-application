import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";

export interface ListCategoriesInput extends IQuery {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position";
  sortOrder?: "asc" | "desc";
}

export interface ListCategoriesResult {
  categories: CategoryDTO[];
  meta: {
    page: number;
    limit: number;
    parentId: string | null;
    includeChildren: boolean;
    sortBy: string;
    sortOrder: string;
  };
}

export class ListCategoriesHandler implements IQueryHandler<ListCategoriesInput, ListCategoriesResult> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: ListCategoriesInput): Promise<ListCategoriesResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const sortBy = input.sortBy ?? "position";
    const sortOrder = input.sortOrder ?? "asc";
    const includeChildren = input.includeChildren ?? false;

    const categories = await this.categoryManagementService.getCategories({
      page, limit, parentId: input.parentId, includeChildren, sortBy, sortOrder,
    });

    return {
      categories,
      meta: { page, limit, parentId: input.parentId ?? null, includeChildren, sortBy, sortOrder },
    };
  }
}
