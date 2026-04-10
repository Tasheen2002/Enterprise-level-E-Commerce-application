import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryManagementService } from "../services/category-management.service";
import { DomainValidationError } from "../../domain/errors/product-catalog.errors";

export interface GetCategoryInput extends IQuery {
  categoryId?: string;
  slug?: string;
}

export class GetCategoryHandler implements IQueryHandler<GetCategoryInput, CategoryDTO> {
  constructor(private readonly categoryManagementService: CategoryManagementService) {}

  async handle(input: GetCategoryInput): Promise<CategoryDTO> {
    if (!input.categoryId && !input.slug) {
      throw new DomainValidationError("Either categoryId or slug is required");
    }
    if (input.categoryId) {
      return this.categoryManagementService.getCategoryById(input.categoryId);
    }
    return this.categoryManagementService.getCategoryBySlug(input.slug!);
  }
}
