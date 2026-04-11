import { Category } from "../entities/category.entity";
import { CategoryId } from "../value-objects/category-id.vo";
import { Slug } from "../value-objects/slug.vo";

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: CategoryId): Promise<Category | null>;
  findBySlug(slug: Slug): Promise<Category | null>;
  findAll(options?: CategoryQueryOptions): Promise<Category[]>;
  findRootCategories(options?: CategoryQueryOptions): Promise<Category[]>;
  findByParentId(
    parentId: CategoryId,
    options?: CategoryQueryOptions,
  ): Promise<Category[]>;
  findChildren(categoryId: CategoryId): Promise<Category[]>;
  findAncestors(categoryId: CategoryId): Promise<Category[]>;
  findDescendants(categoryId: CategoryId): Promise<Category[]>;
  findSiblings(categoryId: CategoryId): Promise<Category[]>;
  update(category: Category): Promise<void>;
  delete(id: CategoryId): Promise<void>;
  exists(id: CategoryId): Promise<boolean>;
  existsBySlug(slug: Slug): Promise<boolean>;
  count(options?: CategoryCountOptions): Promise<number>;
  getMaxPosition(parentId?: CategoryId): Promise<number>;
}

export interface CategoryQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "name" | "position";
  sortOrder?: "asc" | "desc";
  includeEmpty?: boolean; // Include categories with no products
}

export interface CategoryCountOptions {
  parentId?: string;
  rootOnly?: boolean;
}
