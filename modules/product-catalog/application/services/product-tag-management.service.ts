import {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
  TagWithUsageCount,
} from "../../domain/repositories/product-tag.repository";
import {
  IProductTagAssociationRepository,
  AssociationPaginationOptions,
} from "../../domain/repositories/product-tag-association.repository";
import { ProductTag, ProductTagDTO } from "../../domain/entities/product-tag.entity";
import { ProductTagId } from "../../domain/value-objects/product-tag-id.vo";
import { ProductTagAssociation } from "../../domain/entities/product-tag-association.entity";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import {
  ProductTagNotFoundError,
  ProductTagAlreadyExistsError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";
import { randomUUID } from "crypto";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Configuration ────────────────────────────────────────────────────

// Service-level format rule (additional to entity's structural validation).
// Tags are user-facing labels — restrict to safe characters.
const TAG_CHARACTER_PATTERN = /^[a-zA-Z0-9\s\-_]+$/;

// ── Input / result types ─────────────────────────────────────────────

export interface CreateProductTagData {
  tag: string;
  kind?: string;
}

export interface UpdateProductTagInput {
  tag?: string;
  kind?: string;
}

export type ProductTagListResult = PaginatedResult<ProductTagDTO>;

export interface TagWithUsageDTO {
  tag: ProductTagDTO;
  usageCount: number;
}

export interface ProductTagStatsResult {
  totalTags: number;
  tagsByKind: Array<{ kind: string | null; count: number }>;
  averageTagLength: number;
}

export interface BatchDeleteProductTagsResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

// ── Service ───────────────────────────────────────────────────────────

export class ProductTagManagementService {
  constructor(
    private readonly productTagRepository: IProductTagRepository,
    private readonly tagAssociationRepository: IProductTagAssociationRepository,
  ) {}

  // ── Core CRUD ────────────────────────────────────────────────────────

  async createTag(data: CreateProductTagData): Promise<ProductTagDTO> {
    this.assertTagCharacterFormat(data.tag);
    await this.assertTagAvailable(data.tag);

    // Entity owns non-empty + max-length validation.
    const tag = ProductTag.create(data);
    await this.productTagRepository.save(tag);
    return ProductTag.toDTO(tag);
  }

  async getTagById(id: string): Promise<ProductTagDTO> {
    return ProductTag.toDTO(await this.findTagById(id));
  }

  async getTagByName(tagName: string): Promise<ProductTagDTO> {
    const tag = await this.productTagRepository.findByTag(tagName);
    if (!tag) {
      throw new ProductTagNotFoundError(tagName);
    }
    return ProductTag.toDTO(tag);
  }

  async getAllTags(options?: ProductTagQueryOptions): Promise<PaginatedResult<ProductTagDTO>> {
    const { limit = 20, offset = 0 } = options ?? {};

    const [tags, total] = await Promise.all([
      this.productTagRepository.findAll(options),
      this.productTagRepository.count(),
    ]);

    return {
      items: tags.map((t) => ProductTag.toDTO(t)),
      total,
      limit,
      offset,
      hasMore: offset + tags.length < total,
    };
  }

  async getTagsByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<PaginatedResult<ProductTagDTO>> {
    const { limit = 20, offset = 0 } = options ?? {};

    const [tags, total] = await Promise.all([
      this.productTagRepository.findByKind(kind, options),
      this.productTagRepository.count({ kind }),
    ]);

    return {
      items: tags.map((t) => ProductTag.toDTO(t)),
      total,
      limit,
      offset,
      hasMore: offset + tags.length < total,
    };
  }

  async updateTag(
    id: string,
    updates: UpdateProductTagInput,
  ): Promise<ProductTagDTO> {
    const tag = await this.findTagById(id);

    if (updates.tag !== undefined && updates.tag !== tag.tag) {
      this.assertTagCharacterFormat(updates.tag);
      await this.assertTagAvailable(updates.tag);
      tag.updateTag(updates.tag);
    }

    if (updates.kind !== undefined) {
      tag.updateKind(updates.kind);
    }

    await this.productTagRepository.save(tag);
    return ProductTag.toDTO(tag);
  }

  async deleteTag(id: string): Promise<void> {
    const tagId = ProductTagId.fromString(id);

    if (!(await this.productTagRepository.exists(tagId))) {
      throw new ProductTagNotFoundError(id);
    }

    await this.productTagRepository.delete(tagId);
  }

  // ── Search & filtering ─────────────────────────────────────────────

  async searchTags(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<PaginatedResult<ProductTagDTO>> {
    if (!query.trim()) {
      return this.getAllTags(options);
    }

    const { limit = 20, offset = 0 } = options ?? {};
    const trimmed = query.trim();

    // PERF: count derived from a second unpaginated search call. A dedicated
    // `repo.countSearch(query)` would be one round-trip instead of two.
    const [tags, allMatches] = await Promise.all([
      this.productTagRepository.search(trimmed, options),
      this.productTagRepository.search(trimmed, {
        ...options,
        limit: undefined,
        offset: undefined,
      }),
    ]);

    const total = allMatches.length;
    return {
      items: tags.map((t) => ProductTag.toDTO(t)),
      total,
      limit,
      offset,
      hasMore: offset + tags.length < total,
    };
  }

  async getTagSuggestions(
    partialTag: string,
    limit: number = 10,
  ): Promise<ProductTagDTO[]> {
    const suggestions = await this.productTagRepository.search(partialTag, {
      limit,
      sortBy: "tag",
      sortOrder: "asc",
    });

    return suggestions.map((t) => ProductTag.toDTO(t));
  }

  // ── Analytics & statistics ──────────────────────────────────────────

  async getTagStats(): Promise<ProductTagStatsResult> {
    const [totalTags, stats] = await Promise.all([
      this.productTagRepository.count(),
      this.productTagRepository.getStatistics(),
    ]);

    return {
      totalTags,
      tagsByKind: stats.tagsByKind,
      averageTagLength: Math.round(stats.averageTagLength * 100) / 100,
    };
  }

  async getMostUsedTags(limit: number = 10): Promise<TagWithUsageDTO[]> {
    const mostUsed: TagWithUsageCount[] = await this.productTagRepository.getMostUsed(limit);
    return mostUsed.map((item) => ({
      tag: ProductTag.toDTO(item.tag),
      usageCount: item.count,
    }));
  }

  // ── Bulk operations ─────────────────────────────────────────────────

  async createMultipleTags(
    tagData: CreateProductTagData[],
  ): Promise<ProductTagDTO[]> {
    const created: ProductTagDTO[] = [];
    const errors: string[] = [];

    for (const data of tagData) {
      try {
        const tag = await this.createTag(data);
        created.push(tag);
      } catch (error) {
        errors.push(
          `Failed to create tag "${data.tag}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (errors.length > 0 && created.length === 0) {
      throw new InvalidOperationError(`Failed to create any tags: ${errors.join(", ")}`);
    }

    return created;
  }

  async deleteMultipleTags(ids: string[]): Promise<BatchDeleteProductTagsResult> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.deleteTag(id);
        deleted.push(id);
      } catch (error) {
        failed.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { deleted, failed };
  }

  // ── Validation helpers (public) ─────────────────────────────────────

  async validateTag(tagName: string): Promise<boolean> {
    try {
      this.assertTagCharacterFormat(tagName);
      return !(await this.productTagRepository.existsByTag(tagName));
    } catch {
      return false;
    }
  }

  async isTagAvailable(tagName: string): Promise<boolean> {
    return !(await this.productTagRepository.existsByTag(tagName));
  }

  // ── Utility ─────────────────────────────────────────────────────────

  async getTagCount(options?: ProductTagCountOptions): Promise<number> {
    return this.productTagRepository.count(options);
  }

  // ── Product↔tag association methods ────────────────────────────────

  // Single batched repo call replaces the previous N+1 (associations + N findById).
  async getProductTags(productId: string): Promise<ProductTagDTO[]> {
    const productIdVo = ProductId.fromString(productId);
    const associations = await this.tagAssociationRepository.findByProductId(productIdVo);
    if (associations.length === 0) return [];

    const tagIds = associations.map((a) => a.tagId);
    const tags = await this.productTagRepository.findByIds(tagIds);
    return tags.map((t) => ProductTag.toDTO(t));
  }

  // Single batched validation + per-tag association write. The association
  // write loop could be a `bulkInsert` repo method for further optimization
  // when association counts grow large.
  async associateProductTags(
    productId: string,
    tagIds: string[],
  ): Promise<void> {
    if (tagIds.length === 0) return;

    const productIdVo = ProductId.fromString(productId);
    const tagIdVos = tagIds.map((id) => ProductTagId.fromString(id));

    // Validate all tags exist in one query.
    const foundTags = await this.productTagRepository.findByIds(tagIdVos);
    if (foundTags.length !== tagIds.length) {
      const foundIdSet = new Set(foundTags.map((t) => t.id.getValue()));
      const missing = tagIds.filter((id) => !foundIdSet.has(id));
      throw new ProductTagNotFoundError(missing[0]);
    }

    for (const tagIdVo of tagIdVos) {
      const alreadyLinked = await this.tagAssociationRepository.exists(productIdVo, tagIdVo);
      if (alreadyLinked) continue;

      const association = ProductTagAssociation.create({
        id: randomUUID(),
        productId,
        tagId: tagIdVo.getValue(),
      });
      await this.tagAssociationRepository.save(association);
    }
  }

  async removeProductTag(productId: string, tagId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const tagIdVo = ProductTagId.fromString(tagId);
    const exists = await this.tagAssociationRepository.exists(productIdVo, tagIdVo);
    if (!exists) {
      throw new InvalidOperationError(`Tag association not found`);
    }
    await this.tagAssociationRepository.delete(productIdVo, tagIdVo);
  }

  async getTagProducts(
    tagId: string,
    options?: AssociationPaginationOptions,
  ): Promise<PaginatedResult<string>> {
    await this.findTagById(tagId);
    const tagIdVo = ProductTagId.fromString(tagId);
    const { limit = 20, offset = 0 } = options ?? {};

    const [associations, total] = await Promise.all([
      this.tagAssociationRepository.findByTagId(tagIdVo, options),
      this.tagAssociationRepository.countByTagId(tagIdVo),
    ]);

    const items = associations.map((a) => a.productId.getValue());
    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async findTagById(id: string): Promise<ProductTag> {
    const tagId = ProductTagId.fromString(id);
    const tag = await this.productTagRepository.findById(tagId);
    if (!tag) {
      throw new ProductTagNotFoundError(id);
    }
    return tag;
  }

  // Service-level character allowlist (in addition to entity's non-empty + length checks).
  private assertTagCharacterFormat(tag: string): void {
    if (!TAG_CHARACTER_PATTERN.test(tag)) {
      throw new DomainValidationError(
        "Tag can only contain letters, numbers, spaces, hyphens, and underscores",
      );
    }
  }

  private async assertTagAvailable(tag: string): Promise<void> {
    if (await this.productTagRepository.existsByTag(tag)) {
      throw new ProductTagAlreadyExistsError(tag);
    }
  }
}
