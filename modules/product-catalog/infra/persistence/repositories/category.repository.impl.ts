import { PrismaClient, Prisma } from "@prisma/client";
import {
  ICategoryRepository,
  CategoryQueryOptions,
  CategoryCountOptions,
} from "../../../domain/repositories/category.repository";
import { Category } from "../../../domain/entities/category.entity";
import { CategoryId } from "../../../domain/value-objects/category-id.vo";
import { Slug } from "../../../domain/value-objects/slug.vo";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";

export class CategoryRepositoryImpl
  extends PrismaRepository<Category>
  implements ICategoryRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toDomain(row: Prisma.CategoryGetPayload<object>): Category {
    return Category.fromPersistence({
      id: CategoryId.fromString(row.id),
      name: row.name,
      slug: Slug.fromString(row.slug),
      parentId: row.parentId ? CategoryId.fromString(row.parentId) : null,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(category: Category): Promise<void> {
    const data = {
      name: category.name,
      slug: category.slug.getValue(),
      parentId: category.parentId?.getValue() ?? null,
      position: category.position,
      updatedAt: category.updatedAt,
    };
    await this.prisma.category.upsert({
      where: { id: category.id.getValue() },
      create: { id: category.id.getValue(), createdAt: category.createdAt, ...data },
      update: data,
    });
    await this.dispatchEvents(category);
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { id: id.getValue() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: Slug): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { slug: slug.getValue() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(options?: CategoryQueryOptions): Promise<Category[]> {
    const { limit = 100, offset = 0, sortOrder = "asc" } = options || {};

    const rows = await this.prisma.category.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findRootCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    const { limit = 100, offset = 0, sortOrder = "asc" } = options || {};

    const rows = await this.prisma.category.findMany({
      where: { parentId: null },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByParentId(
    parentId: CategoryId,
    options?: CategoryQueryOptions,
  ): Promise<Category[]> {
    const { limit = 100, offset = 0, sortOrder = "asc" } = options || {};

    const rows = await this.prisma.category.findMany({
      where: { parentId: parentId.getValue() },
      take: limit,
      skip: offset,
      orderBy: [
        { position: { sort: sortOrder, nulls: "last" } },
        { name: "asc" },
      ],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findChildren(categoryId: CategoryId): Promise<Category[]> {
    return this.findByParentId(categoryId);
  }

  /**
   * Loads ancestors using a single bulk fetch + in-memory traversal.
   * Fetches all rows up-front keyed by id to avoid N+1 queries.
   */
  async findAncestors(categoryId: CategoryId): Promise<Category[]> {
    // Load all categories once — category trees are typically small enough for this.
    const allRows = await this.prisma.category.findMany();
    const byId = new Map(allRows.map((r) => [r.id, r]));

    const ancestors: Category[] = [];
    let currentId: string | null = categoryId.getValue();

    while (currentId) {
      const row = byId.get(currentId);
      if (!row || !row.parentId) break;
      const parentRow = byId.get(row.parentId);
      if (!parentRow) break;
      ancestors.unshift(this.toDomain(parentRow));
      currentId = parentRow.id;
    }

    return ancestors;
  }

  /**
   * Loads descendants using a single bulk fetch + in-memory BFS.
   * Avoids N+1 queries that the previous loop-with-DB-calls approach caused.
   */
  async findDescendants(categoryId: CategoryId): Promise<Category[]> {
    // Load all categories once.
    const allRows = await this.prisma.category.findMany();
    const byParent = new Map<string, typeof allRows>();

    for (const row of allRows) {
      if (row.parentId) {
        if (!byParent.has(row.parentId)) byParent.set(row.parentId, []);
        byParent.get(row.parentId)!.push(row);
      }
    }

    const descendants: Category[] = [];
    const queue: string[] = [categoryId.getValue()];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = byParent.get(currentId) ?? [];
      for (const child of children) {
        descendants.push(this.toDomain(child));
        queue.push(child.id);
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
    const whereClause: Prisma.CategoryWhereInput = {};

    // rootOnly takes precedence — mutually exclusive with parentId filter
    if (options?.rootOnly) {
      whereClause.parentId = null;
    } else if (options?.parentId) {
      whereClause.parentId = options.parentId.getValue();
    }

    return this.prisma.category.count({ where: whereClause });
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

    return result._max.position ?? 0;
  }
}
