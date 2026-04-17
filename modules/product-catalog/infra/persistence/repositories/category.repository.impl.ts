import { PrismaClient } from "@prisma/client";
import {
  ICategoryRepository,
  CategoryQueryOptions,
  CategoryCountOptions,
} from "../../../domain/repositories/category.repository";
import { Category } from "../../../domain/entities/category.entity";
import { CategoryId } from "../../../domain/value-objects/category-id.vo";
import { Slug } from "../../../domain/value-objects/slug.vo";

export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(category: Category): Promise<void> {
    const data = {
      name: category.name,
      slug: category.slug.getValue(),
      parentId: category.parentId?.getValue() ?? null,
      position: category.position,
    };
    await this.prisma.category.upsert({
      where: { id: category.id.getValue() },
      create: { id: category.id.getValue(), ...data },
      update: data,
    });
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { id: id.getValue() },
    });

    if (!row) return null;

    return Category.fromPersistence({
      id: CategoryId.fromString(row.id),
      name: row.name,
      slug: Slug.fromString(row.slug),
      parentId: row.parentId ? CategoryId.fromString(row.parentId) : null,
      position: row.position,
    });
  }

  async findBySlug(slug: Slug): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { slug: slug.getValue() },
    });

    if (!row) return null;

    return Category.fromPersistence({
      id: CategoryId.fromString(row.id),
      name: row.name,
      slug: Slug.fromString(row.slug),
      parentId: row.parentId ? CategoryId.fromString(row.parentId) : null,
      position: row.position,
    });
  }

  async findAll(options?: CategoryQueryOptions): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortOrder = "asc",
    } = options || {};

    const rows = await this.prisma.category.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) =>
      Category.fromPersistence({
        id: CategoryId.fromString(row.id),
        name: row.name,
        slug: Slug.fromString(row.slug),
        parentId: row.parentId ? CategoryId.fromString(row.parentId) : null,
        position: row.position,
      }),
    );
  }

  async findRootCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortOrder = "asc",
    } = options || {};

    const rows = await this.prisma.category.findMany({
      where: { parentId: null },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) =>
      Category.fromPersistence({
        id: CategoryId.fromString(row.id),
        name: row.name,
        slug: Slug.fromString(row.slug),
        parentId: null,
        position: row.position,
      }),
    );
  }

  async findByParentId(
    parentId: CategoryId,
    options?: CategoryQueryOptions,
  ): Promise<Category[]> {
    const {
      limit = 100,
      offset = 0,
      sortOrder = "asc",
    } = options || {};

    const rows = await this.prisma.category.findMany({
      where: { parentId: parentId.getValue() },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) =>
      Category.fromPersistence({
        id: CategoryId.fromString(row.id),
        name: row.name,
        slug: Slug.fromString(row.slug),
        parentId: CategoryId.fromString(row.parentId!),
        position: row.position,
      }),
    );
  }

  async findChildren(categoryId: CategoryId): Promise<Category[]> {
    return this.findByParentId(categoryId);
  }

  async findAncestors(categoryId: CategoryId): Promise<Category[]> {
    const ancestors: Category[] = [];
    let currentCategory = await this.findById(categoryId);

    while (currentCategory && currentCategory.hasParent()) {
      const parentId = currentCategory.parentId;
      if (parentId) {
        const parent = await this.findById(parentId);
        if (parent) {
          ancestors.unshift(parent);
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
        toProcess.push(child.id);
      }
    }

    return descendants;
  }

  async findSiblings(categoryId: CategoryId): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category) return [];

    const parentId = category.parentId;

    if (parentId) {
      const siblings = await this.findByParentId(parentId);
      return siblings.filter((sibling) => !sibling.id.equals(categoryId));
    } else {
      const rootCategories = await this.findRootCategories();
      return rootCategories.filter((sibling) => !sibling.id.equals(categoryId));
    }
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

    return await this.prisma.category.count({ where: whereClause });
  }

  async getMaxPosition(parentId?: CategoryId): Promise<number> {
    const result = await this.prisma.category.aggregate({
      where: {
        parentId: parentId?.getValue() ?? null,
      },
      _max: {
        position: true,
      },
    });

    return result._max.position || 0;
  }
}
