import {
  ICategoryRepository,
  CategoryQueryOptions,
} from "../../domain/repositories/category.repository";
import { Category, CategoryDTO } from "../../domain/entities/category.entity";
import { CategoryId } from "../../domain/value-objects/category-id.vo";
import { Slug } from "../../domain/value-objects/slug.vo";
import {
  CategoryNotFoundError,
  CategoryAlreadyExistsError,
  CategoryDeletionError,
  InvalidOperationError,
} from "../../domain/errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

type CreateCategoryData = {
  name: string;
  parentId?: string | null;
  position?: number;
};

export interface CategoryQueryServiceOptions {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position";
  sortOrder?: "asc" | "desc";
}

export interface CategoryTreeNode {
  category: CategoryDTO;
  children: CategoryTreeNode[];
  depth: number;
}

export interface CategoryReorderItem {
  id: string;
  position: number;
}

export type CategoryListResult = PaginatedResult<CategoryDTO>;

export interface CategoryStatistics {
  totalCategories: number;
  rootCategories: number;
  maxDepth: number;
  averageChildrenPerCategory: number;
}

export class CategoryManagementService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async createCategory(data: CreateCategoryData): Promise<CategoryDTO> {
    if (data.parentId) {
      const parentId = CategoryId.fromString(data.parentId);
      const parentExists = await this.categoryRepository.exists(parentId);
      if (!parentExists) {
        throw new CategoryNotFoundError(data.parentId);
      }
    }

    const slug = Slug.create(data.name);
    const existingCategory = await this.categoryRepository.findBySlug(slug);
    if (existingCategory) {
      throw new CategoryAlreadyExistsError(slug.getValue());
    }

    let position = data.position;
    if (position === undefined) {
      const parentId = data.parentId
        ? CategoryId.fromString(data.parentId)
        : undefined;
      const maxPosition =
        await this.categoryRepository.getMaxPosition(parentId);
      position = maxPosition + 1;
    }

    const category = Category.create({
      ...data,
      position,
      parentId: data.parentId ?? undefined,
    });
    await this.categoryRepository.save(category);
    return Category.toDTO(category);
  }

  async getCategoryById(id: string): Promise<CategoryDTO> {
    return Category.toDTO(await this.getCategory(id));
  }

  async getCategoryBySlug(slug: string): Promise<CategoryDTO> {
    const slugVo = Slug.fromString(slug);
    const category = await this.categoryRepository.findBySlug(slugVo);
    if (!category) {
      throw new CategoryNotFoundError(slug);
    }
    return Category.toDTO(category);
  }

  async getCategories(
    options: CategoryQueryServiceOptions = {},
  ): Promise<PaginatedResult<CategoryDTO>> {
    const {
      page = 1,
      limit = 20,
      parentId,
      includeChildren = false,
      sortBy = "position",
      sortOrder = "asc",
    } = options;

    const offset = (page - 1) * limit;
    const repositoryOptions: CategoryQueryOptions = { limit, offset, sortBy, sortOrder };

    const parentCategoryId = parentId ? CategoryId.fromString(parentId) : null;

    let categories: Category[];
    let total: number;

    if (parentCategoryId) {
      if (includeChildren) {
        // Descendants: naturally bounded by tree depth — no separate count.
        categories = await this.categoryRepository.findDescendants(parentCategoryId);
        total = categories.length;
      } else {
        [categories, total] = await Promise.all([
          this.categoryRepository.findByParentId(parentCategoryId, repositoryOptions),
          this.categoryRepository.count({ parentId: parentCategoryId }),
        ]);
      }
    } else {
      if (includeChildren) {
        [categories, total] = await Promise.all([
          this.categoryRepository.findAll(repositoryOptions),
          this.categoryRepository.count(),
        ]);
      } else {
        [categories, total] = await Promise.all([
          this.categoryRepository.findRootCategories(repositoryOptions),
          this.categoryRepository.count({ rootOnly: true }),
        ]);
      }
    }

    return {
      items: categories.map((c) => Category.toDTO(c)),
      total,
      limit,
      offset,
      hasMore: offset + categories.length < total,
    };
  }

  async getAllCategories(
    options: CategoryQueryServiceOptions = {},
  ): Promise<CategoryDTO[]> {
    const {
      page = 1,
      limit = 100,
      sortBy = "position",
      sortOrder = "asc",
    } = options;

    const repositoryOptions: CategoryQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    const categories = await this.categoryRepository.findAll(repositoryOptions);
    return categories.map((c) => Category.toDTO(c));
  }

  // PERF: recursive findByParentId per node (N+1). Fine for typical catalog
  // depths/sizes; for large trees, replace with a single self-join query
  // (e.g., recursive CTE) returning all rows in one round-trip.
  async getCategoryHierarchy(): Promise<CategoryTreeNode[]> {
    const rootCategories = await this.categoryRepository.findRootCategories({
      sortBy: "position",
      sortOrder: "asc",
    });

    const buildTree = async (
      categories: Category[],
      depth: number = 0,
    ): Promise<CategoryTreeNode[]> => {
      const nodes: CategoryTreeNode[] = [];

      for (const category of categories) {
        const children = await this.categoryRepository.findByParentId(
          category.id,
          { sortBy: "position", sortOrder: "asc" },
        );
        const childNodes = await buildTree(children, depth + 1);

        nodes.push({
          category: Category.toDTO(category),
          children: childNodes,
          depth,
        });
      }

      return nodes;
    };

    return await buildTree(rootCategories);
  }

  async getCategoryChildren(categoryId: string): Promise<CategoryDTO[]> {
    const id = CategoryId.fromString(categoryId);
    const categories = await this.categoryRepository.findChildren(id);
    return categories.map((c) => Category.toDTO(c));
  }

  async getCategoryAncestors(categoryId: string): Promise<CategoryDTO[]> {
    const id = CategoryId.fromString(categoryId);
    const categories = await this.categoryRepository.findAncestors(id);
    return categories.map((c) => Category.toDTO(c));
  }

  async getCategoryDescendants(categoryId: string): Promise<CategoryDTO[]> {
    const id = CategoryId.fromString(categoryId);
    const categories = await this.categoryRepository.findDescendants(id);
    return categories.map((c) => Category.toDTO(c));
  }

  async getCategorySiblings(categoryId: string): Promise<CategoryDTO[]> {
    const id = CategoryId.fromString(categoryId);
    const categories = await this.categoryRepository.findSiblings(id);
    return categories.map((c) => Category.toDTO(c));
  }

  async updateCategory(
    id: string,
    updateData: Partial<CreateCategoryData>,
  ): Promise<CategoryDTO> {
    const categoryId = CategoryId.fromString(id);
    const category = await this.getCategory(id);

    if (updateData.name !== undefined) {
      const newSlug = Slug.create(updateData.name);
      const existingCategory =
        await this.categoryRepository.findBySlug(newSlug);
      if (existingCategory && !existingCategory.id.equals(categoryId)) {
        throw new CategoryAlreadyExistsError(newSlug.getValue());
      }
      category.updateName(updateData.name);
    }

    if (updateData.parentId !== undefined) {
      if (updateData.parentId) {
        const newParentId = CategoryId.fromString(updateData.parentId);

        if (categoryId.equals(newParentId)) {
          throw new InvalidOperationError("Category cannot be its own parent");
        }

        if (await this.wouldCreateCycle(categoryId, newParentId)) {
          throw new InvalidOperationError(
            "Invalid category hierarchy - would create circular reference",
          );
        }

        const parentExists = await this.categoryRepository.exists(newParentId);
        if (!parentExists) {
          throw new CategoryNotFoundError(updateData.parentId);
        }
      }

      category.moveToParent(updateData.parentId);
    }

    if (updateData.position !== undefined) {
      category.updatePosition(updateData.position);
    }

    await this.categoryRepository.save(category);
    return Category.toDTO(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const categoryId = CategoryId.fromString(id);
    await this.getCategory(id);

    const children = await this.categoryRepository.findChildren(categoryId);
    if (children.length > 0) {
      throw new CategoryDeletionError("category has existing subcategories");
    }

    await this.categoryRepository.delete(categoryId);
  }

  async reorderCategories(
    categoryOrders: CategoryReorderItem[],
  ): Promise<void> {
    for (const orderItem of categoryOrders) {
      const categoryId = CategoryId.fromString(orderItem.id);
      const exists = await this.categoryRepository.exists(categoryId);
      if (!exists) {
        throw new CategoryNotFoundError(orderItem.id);
      }
    }

    for (const orderItem of categoryOrders) {
      const categoryId = CategoryId.fromString(orderItem.id);
      const category = await this.categoryRepository.findById(categoryId);
      if (category) {
        category.updatePosition(orderItem.position);
        await this.categoryRepository.save(category);
      }
    }
  }

  // PERF: O(N) findChildren queries (N+1) for averageChildrenPerCategory and
  // recursive depth traversal. Acceptable while category counts are small;
  // refactor with `groupBy(parentId)` aggregation if categories grow large.
  async getCategoryStatistics(): Promise<CategoryStatistics> {
    const [allCategories, rootCategories] = await Promise.all([
      this.categoryRepository.findAll(),
      this.categoryRepository.findRootCategories(),
    ]);

    let maxDepth = 0;
    for (const rootCategory of rootCategories) {
      const depth = await this.calculateCategoryDepth(rootCategory.id);
      maxDepth = Math.max(maxDepth, depth);
    }

    let totalChildren = 0;
    for (const category of allCategories) {
      const children = await this.categoryRepository.findChildren(category.id);
      totalChildren += children.length;
    }
    const averageChildrenPerCategory =
      allCategories.length > 0 ? totalChildren / allCategories.length : 0;

    return {
      totalCategories: allCategories.length,
      rootCategories: rootCategories.length,
      maxDepth,
      averageChildrenPerCategory:
        Math.round(averageChildrenPerCategory * 100) / 100,
    };
  }

  async validateCategoryHierarchy(
    categoryId: string,
    newParentId?: string,
  ): Promise<boolean> {
    if (!newParentId) {
      return true;
    }

    const id = CategoryId.fromString(categoryId);
    const parentId = CategoryId.fromString(newParentId);

    if (id.equals(parentId)) {
      return false;
    }

    const parentExists = await this.categoryRepository.exists(parentId);
    if (!parentExists) {
      return false;
    }

    return !(await this.wouldCreateCycle(id, parentId));
  }

  private async getCategory(id: string): Promise<Category> {
    const categoryId = CategoryId.fromString(id);
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }
    return category;
  }

  private async wouldCreateCycle(
    categoryId: CategoryId,
    proposedParentId: CategoryId,
  ): Promise<boolean> {
    const descendants = await this.categoryRepository.findDescendants(categoryId);
    return descendants.some((desc) => desc.id.equals(proposedParentId));
  }

  private async calculateCategoryDepth(
    categoryId: CategoryId,
    currentDepth: number = 1,
  ): Promise<number> {
    const children = await this.categoryRepository.findChildren(categoryId);

    if (children.length === 0) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;
    for (const child of children) {
      const childDepth = await this.calculateCategoryDepth(
        child.id,
        currentDepth + 1,
      );
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  }
}
