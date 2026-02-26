import {
  ICategoryRepository,
  CategoryQueryOptions,
} from "../../domain/repositories/category.repository";
import {
  Category,
  CreateCategoryData,
} from "../../domain/entities/category.entity";
import { CategoryId } from "../../domain/value-objects/category-id.vo";
import { Slug } from "../../domain/value-objects/slug.vo";
import { SlugGeneratorService } from "./slug-generator.service";
import {
  CategoryNotFoundError,
  CategoryAlreadyExistsError,
  CategoryDeletionError,
  InvalidOperationError,
} from "../../domain/errors";

export interface CategoryQueryServiceOptions {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
  depth: number;
}

export interface CategoryReorderItem {
  id: string;
  position: number;
}

export class CategoryManagementService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly slugGeneratorService: SlugGeneratorService,
  ) {}

  async createCategory(data: CreateCategoryData): Promise<Category> {
    // Validate parent exists if provided
    if (data.parentId) {
      const parentId = CategoryId.fromString(data.parentId);
      const parentExists = await this.categoryRepository.exists(parentId);
      if (!parentExists) {
        throw new CategoryNotFoundError(data.parentId);
      }
    }

    // Check for duplicate name/slug
    const slug = Slug.create(data.name);
    const existingCategory = await this.categoryRepository.findBySlug(slug);
    if (existingCategory) {
      throw new CategoryAlreadyExistsError(slug.getValue());
    }

    // Generate position if not provided
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
    });

    await this.categoryRepository.save(category);
    return category;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const categoryId = CategoryId.fromString(id);
    return await this.categoryRepository.findById(categoryId);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const slugVo = Slug.fromString(slug);
    return await this.categoryRepository.findBySlug(slugVo);
  }

  async getCategories(
    options: CategoryQueryServiceOptions = {},
  ): Promise<Category[]> {
    const {
      page = 1,
      limit = 50,
      parentId,
      includeChildren = false,
      sortBy = "position",
      sortOrder = "asc",
    } = options;

    const repositoryOptions: CategoryQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy,
      sortOrder,
    };

    if (parentId) {
      const parentCategoryId = CategoryId.fromString(parentId);
      if (includeChildren) {
        // Return all descendants recursively
        return await this.categoryRepository.findDescendants(parentCategoryId);
      } else {
        // Return only direct children
        return await this.categoryRepository.findByParentId(
          parentCategoryId,
          repositoryOptions,
        );
      }
    } else {
      if (includeChildren) {
        // Return all categories (root and their descendants)
        return await this.categoryRepository.findAll(repositoryOptions);
      } else {
        // Return only root categories
        return await this.categoryRepository.findRootCategories(
          repositoryOptions,
        );
      }
    }
  }

  async getAllCategories(
    options: CategoryQueryServiceOptions = {},
  ): Promise<Category[]> {
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

    return await this.categoryRepository.findAll(repositoryOptions);
  }

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
          category.getId(),
          { sortBy: "position", sortOrder: "asc" },
        );
        const childNodes = await buildTree(children, depth + 1);

        nodes.push({
          category,
          children: childNodes,
          depth,
        });
      }

      return nodes;
    };

    return await buildTree(rootCategories);
  }

  async getCategoryChildren(categoryId: string): Promise<Category[]> {
    const id = CategoryId.fromString(categoryId);
    return await this.categoryRepository.findChildren(id);
  }

  async getCategoryAncestors(categoryId: string): Promise<Category[]> {
    const id = CategoryId.fromString(categoryId);
    return await this.categoryRepository.findAncestors(id);
  }

  async getCategoryDescendants(categoryId: string): Promise<Category[]> {
    const id = CategoryId.fromString(categoryId);
    return await this.categoryRepository.findDescendants(id);
  }

  async getCategorySiblings(categoryId: string): Promise<Category[]> {
    const id = CategoryId.fromString(categoryId);
    return await this.categoryRepository.findSiblings(id);
  }

  async updateCategory(
    id: string,
    updateData: Partial<CreateCategoryData>,
  ): Promise<Category | null> {
    const categoryId = CategoryId.fromString(id);
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    // Update name if provided
    if (updateData.name !== undefined) {
      // Check for duplicate name/slug (excluding current category)
      const newSlug = Slug.create(updateData.name);
      const existingCategory =
        await this.categoryRepository.findBySlug(newSlug);
      if (existingCategory && !existingCategory.getId().equals(categoryId)) {
        throw new CategoryAlreadyExistsError(newSlug.getValue());
      }

      category.updateName(updateData.name);
    }

    // Update parent if provided
    if (updateData.parentId !== undefined) {
      if (updateData.parentId) {
        const newParentId = CategoryId.fromString(updateData.parentId);

        // Prevent circular references
        if (categoryId.equals(newParentId)) {
          throw new InvalidOperationError("Category cannot be its own parent");
        }

        // Check if new parent would create circular reference
        const descendants =
          await this.categoryRepository.findDescendants(categoryId);
        const wouldCreateCircularRef = descendants.some((desc) =>
          desc.getId().equals(newParentId),
        );
        if (wouldCreateCircularRef) {
          throw new InvalidOperationError(
            "Invalid category hierarchy - would create circular reference",
          );
        }

        // Verify parent exists
        const parentExists = await this.categoryRepository.exists(newParentId);
        if (!parentExists) {
          throw new CategoryNotFoundError(updateData.parentId!);
        }
      }

      category.moveToParent(updateData.parentId);
    }

    // Update position if provided
    if (updateData.position !== undefined) {
      category.updatePosition(updateData.position);
    }

    await this.categoryRepository.update(category);
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categoryId = CategoryId.fromString(id);
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      return false;
    }

    // Check if category has children
    const children = await this.categoryRepository.findChildren(categoryId);
    if (children.length > 0) {
      throw new CategoryDeletionError("category has existing subcategories");
    }

    await this.categoryRepository.delete(categoryId);
    return true;
  }

  async reorderCategories(
    categoryOrders: CategoryReorderItem[],
  ): Promise<void> {
    // Validate all categories exist
    for (const orderItem of categoryOrders) {
      const categoryId = CategoryId.fromString(orderItem.id);
      const exists = await this.categoryRepository.exists(categoryId);
      if (!exists) {
        throw new CategoryNotFoundError(orderItem.id);
      }
    }

    // Update positions
    for (const orderItem of categoryOrders) {
      const categoryId = CategoryId.fromString(orderItem.id);
      const category = await this.categoryRepository.findById(categoryId);

      if (category) {
        category.updatePosition(orderItem.position);
        await this.categoryRepository.update(category);
      }
    }
  }

  async getCategoryStatistics(): Promise<{
    totalCategories: number;
    rootCategories: number;
    maxDepth: number;
    averageChildrenPerCategory: number;
  }> {
    const allCategories = await this.categoryRepository.findAll();
    const rootCategories = await this.categoryRepository.findRootCategories();

    // Calculate max depth
    let maxDepth = 0;
    for (const rootCategory of rootCategories) {
      const depth = await this.calculateCategoryDepth(rootCategory.getId());
      maxDepth = Math.max(maxDepth, depth);
    }

    // Calculate average children per category
    let totalChildren = 0;
    for (const category of allCategories) {
      const children = await this.categoryRepository.findChildren(
        category.getId(),
      );
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
        child.getId(),
        currentDepth + 1,
      );
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  }

  async validateCategoryHierarchy(
    categoryId: string,
    newParentId?: string,
  ): Promise<boolean> {
    const id = CategoryId.fromString(categoryId);

    if (!newParentId) {
      return true; // Root category is always valid
    }

    const parentId = CategoryId.fromString(newParentId);

    // Check if parent exists
    const parentExists = await this.categoryRepository.exists(parentId);
    if (!parentExists) {
      return false;
    }

    // Check for self-reference
    if (id.equals(parentId)) {
      return false;
    }

    // Check for circular reference
    const descendants = await this.categoryRepository.findDescendants(id);
    const wouldCreateCircularRef = descendants.some((desc) =>
      desc.getId().equals(parentId),
    );

    return !wouldCreateCircularRef;
  }
}
