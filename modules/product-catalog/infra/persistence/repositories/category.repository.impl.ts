import { PrismaClient } from "@prisma/client";
import {
  ICategoryRepository,
  CategoryQueryOptions,
  CategoryCountOptions,
} from "../../../domain/repositories/category.repository";
import { Category } from "../../../domain/entities/category.entity";
import { CategoryId } from "../../../domain/value-objects/category-id.vo";
import { Slug } from "../../../domain/value-objects/slug.vo";

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(category: Category): Promise<void> {
    const data = category.toDatabaseRow();

    await this.prisma.category.create({
      data: {
        id: data.category_id,
        name: data.name,
        slug: data.slug,
        parentId: data.parent_id,
        position: data.position,
      },
    });
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const categoryData = await this.prisma.category.findUnique({
      where: { id: id.getValue() },
    });

    if (!categoryData) {
      return null;
    }

    return Category.fromDatabaseRow({
      category_id: categoryData.id,
      name: categoryData.name,
      slug: categoryData.slug,
      parent_id: categoryData.parentId,
      position: categoryData.position,
    });
  }

  async findBySlug(slug: Slug): Promise<Category | null> {
    const categoryData = await this.prisma.category.findUnique({
      where: { slug: slug.getValue() },
    });

    if (!categoryData) {
      return null;
    }

    return Category.fromDatabaseRow({
      category_id: categoryData.id,
      name: categoryData.name,
      slug: categoryData.slug,
      parent_id: categoryData.parentId,
      position: categoryData.position,
    });
  }

  async findAll(options?: CategoryQueryOptions): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "position",
      sortOrder = "asc",
      includeEmpty = true,
    } = options || {};

    const categories = await this.prisma.category.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" }, // Secondary sort by name for consistency
      ],
    });

    return categories.map((categoryData) => {
      return Category.fromDatabaseRow({
        category_id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        parent_id: categoryData.parentId,
        position: categoryData.position,
      });
    });
  }

  async findRootCategories(
    options?: CategoryQueryOptions,
  ): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "position",
      sortOrder = "asc",
    } = options || {};

    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" }, // Secondary sort by name for consistency
      ],
    });

    return categories.map((categoryData) => {
      return Category.fromDatabaseRow({
        category_id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        parent_id: categoryData.parentId,
        position: categoryData.position,
      });
    });
  }

  async findByParentId(
    parentId: CategoryId,
    options?: CategoryQueryOptions,
  ): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = "position",
      sortOrder = "asc",
    } = options || {};

    const categories = await this.prisma.category.findMany({
      where: { parentId: parentId.getValue() },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" }, // Secondary sort by name for consistency
      ],
    });

    return categories.map((categoryData) => {
      return Category.fromDatabaseRow({
        category_id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        parent_id: categoryData.parentId,
        position: categoryData.position,
      });
    });
  }

  async findChildren(categoryId: CategoryId): Promise<Category[]> {
    return this.findByParentId(categoryId);
  }

  async findAncestors(categoryId: CategoryId): Promise<Category[]> {
    const ancestors: Category[] = [];
    let currentCategory = await this.findById(categoryId);

    while (currentCategory && currentCategory.hasParent()) {
      const parentId = currentCategory.getParentId();
      if (parentId) {
        const parent = await this.findById(parentId);
        if (parent) {
          ancestors.unshift(parent); // Add to beginning for correct order
          currentCategory = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return ancestors;
  }

  async findDescendants(categoryId: CategoryId): Promise<Category[]> {
    const descendants: Category[] = [];
    const toProcess = [categoryId];

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const children = await this.findByParentId(currentId);

      for (const child of children) {
        descendants.push(child);
        toProcess.push(child.getId());
      }
    }

    return descendants;
  }

  async findSiblings(categoryId: CategoryId): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category) {
      return [];
    }

    const parentId = category.getParentId();

    if (parentId) {
      const siblings = await this.findByParentId(parentId);
      return siblings.filter((sibling) => !sibling.getId().equals(categoryId));
    } else {
      // Root category - find other root categories
      const rootCategories = await this.findRootCategories();
      return rootCategories.filter(
        (sibling) => !sibling.getId().equals(categoryId),
      );
    }
  }

  async update(category: Category): Promise<void> {
    const data = category.toDatabaseRow();

    await this.prisma.category.update({
      where: { id: data.category_id },
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parent_id,
        position: data.position,
      },
    });
  }

  async delete(id: CategoryId): Promise<void> {
    await this.prisma.category.delete({
      where: { id: id.getValue() },
    });
  }

  async exists(id: CategoryId): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { slug: slug.getValue() },
    });
    return count > 0;
  }

  async count(options?: CategoryCountOptions): Promise<number> {
    const whereClause: any = {};

    if (options?.parentId) {
      whereClause.parentId = options.parentId;
    }

    if (options?.rootOnly) {
      whereClause.parentId = null;
    }

    return await this.prisma.category.count({
      where: whereClause,
    });
  }

  async getMaxPosition(parentId?: CategoryId): Promise<number> {
    const result = await this.prisma.category.aggregate({
      where: {
        parentId: parentId?.getValue() || null,
      },
      _max: {
        position: true,
      },
    });

    return result._max.position || 0;
  }
}
