import {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
} from "../../domain/repositories/product-tag.repository";
import { IProductTagAssociationRepository } from "../../domain/repositories/iproduct-tag-association.repository";
import {
  ProductTag,
  ProductTagDTO,
  ProductTagId,
} from "../../domain/entities/product-tag.entity";
import { ProductTagAssociation } from "../../domain/entities/product-tag-association.entity";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import {
  ProductTagNotFoundError,
  ProductTagAlreadyExistsError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";
import { randomUUID } from 'crypto';

type CreateProductTagData = { tag: string; kind?: string };

export class ProductTagManagementService {
  constructor(
    private readonly productTagRepository: IProductTagRepository,
    private readonly tagAssociationRepository: IProductTagAssociationRepository,
  ) {}

  // Core CRUD operations
  async createTag(data: CreateProductTagData): Promise<ProductTagDTO> {
    // Validate tag uniqueness
    if (await this.productTagRepository.existsByTag(data.tag)) {
      throw new ProductTagAlreadyExistsError(data.tag);
    }

    // Validate tag format
    this.validateTagFormat(data.tag);

    const tag = ProductTag.create(data);
    await this.productTagRepository.save(tag);

    return ProductTag.toDTO(tag);
  }

  async getTagById(id: string): Promise<ProductTagDTO> {
    const tag = await this.findTagById(id);
    return ProductTag.toDTO(tag);
  }

  async getTagByName(tagName: string): Promise<ProductTagDTO> {
    const tag = await this.productTagRepository.findByTag(tagName);

    if (!tag) {
      throw new ProductTagNotFoundError(tagName);
    }

    return ProductTag.toDTO(tag);
  }

  async getAllTags(options?: ProductTagQueryOptions): Promise<{
    tags: ProductTagDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { limit = 20, offset = 0 } = options || {};
    const page = Math.floor(offset / limit) + 1;

    const [tags, total] = await Promise.all([
      this.productTagRepository.findAll(options),
      this.productTagRepository.count(),
    ]);

    return {
      tags: tags.map((t) => ProductTag.toDTO(t)),
      total,
      page,
      limit,
    };
  }

  async getTagsByKind(
    kind: string,
    options?: ProductTagQueryOptions,
  ): Promise<{
    tags: ProductTagDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { limit = 20, offset = 0 } = options || {};
    const page = Math.floor(offset / limit) + 1;

    const [tags, total] = await Promise.all([
      this.productTagRepository.findByKind(kind, options),
      this.productTagRepository.count({ kind }),
    ]);

    return {
      tags: tags.map((t) => ProductTag.toDTO(t)),
      total,
      page,
      limit,
    };
  }

  async updateTag(
    id: string,
    updates: { tag?: string; kind?: string },
  ): Promise<ProductTagDTO> {
    const tag = await this.findTagById(id);

    // Check if new tag name already exists (if changing tag name)
    if (updates.tag && updates.tag !== tag.tag) {
      if (await this.productTagRepository.existsByTag(updates.tag)) {
        throw new ProductTagAlreadyExistsError(updates.tag);
      }
      this.validateTagFormat(updates.tag);
      tag.updateTag(updates.tag);
    }

    // Update kind if provided
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

  // Search and filtering
  async searchTags(
    query: string,
    options?: ProductTagQueryOptions,
  ): Promise<{
    tags: ProductTagDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (!query.trim()) {
      return this.getAllTags(options);
    }

    const { limit = 20, offset = 0 } = options || {};
    const page = Math.floor(offset / limit) + 1;

    const searchQuery = query.trim();
    const [tags, total] = await Promise.all([
      this.productTagRepository.search(searchQuery, options),
      this.productTagRepository
        .search(searchQuery, {
          ...options,
          limit: undefined,
          offset: undefined,
        })
        .then((results) => results.length),
    ]);

    return {
      tags: tags.map((t) => ProductTag.toDTO(t)),
      total,
      page,
      limit,
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

  // Analytics and statistics
  async getTagStats(): Promise<{
    totalTags: number;
    tagsByKind: Array<{ kind: string | null; count: number }>;
    averageTagLength: number;
  }> {
    // Get total count efficiently
    const totalTags = await this.productTagRepository.count();

    // Get stats with database aggregation
    const stats = await this.productTagRepository.getStatistics();

    return {
      totalTags,
      tagsByKind: stats.tagsByKind,
      averageTagLength: Math.round(stats.averageTagLength * 100) / 100,
    };
  }

  async getMostUsedTags(
    limit: number = 10,
  ): Promise<Array<{ tag: ProductTagDTO; usageCount: number }>> {
    const mostUsed = await this.productTagRepository.getMostUsed(limit);
    return mostUsed.map((item) => ({
      tag: ProductTag.toDTO(item.tag),
      usageCount: item.count,
    }));
  }

  async getUnusedTags(): Promise<ProductTagDTO[]> {
    return [];
  }

  // Bulk operations
  async createMultipleTags(
    tagData: CreateProductTagData[],
  ): Promise<ProductTagDTO[]> {
    const createdTags: ProductTagDTO[] = [];
    const errors: string[] = [];

    for (const data of tagData) {
      try {
        const tag = await this.createTag(data);
        createdTags.push(tag);
      } catch (error) {
        errors.push(
          `Failed to create tag "${data.tag}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (errors.length > 0 && createdTags.length === 0) {
      throw new InvalidOperationError(`Failed to create any tags: ${errors.join(", ")}`);
    }

    return createdTags;
  }

  async deleteMultipleTags(ids: string[]): Promise<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
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

  // Validation methods
  async validateTag(tagName: string): Promise<boolean> {
    try {
      this.validateTagFormat(tagName);
      return !(await this.productTagRepository.existsByTag(tagName));
    } catch {
      return false;
    }
  }

  async isTagAvailable(tagName: string): Promise<boolean> {
    return !(await this.productTagRepository.existsByTag(tagName));
  }

  // Utility methods
  async getTagCount(options?: ProductTagCountOptions): Promise<number> {
    return await this.productTagRepository.count(options);
  }

  async normalizeTagName(tagName: string): Promise<string> {
    return tagName.trim().toLowerCase().replace(/\s+/g, "-");
  }

  // Product Tag Association Methods
  async getProductTags(productId: string): Promise<ProductTagDTO[]> {
    const productIdVo = ProductId.fromString(productId);
    const associations = await this.tagAssociationRepository.findByProductId(productIdVo);
    const tags: ProductTag[] = [];
    for (const assoc of associations) {
      const tag = await this.productTagRepository.findById(assoc.tagId);
      if (tag) tags.push(tag);
    }
    return tags.map((t) => ProductTag.toDTO(t));
  }

  async associateProductTags(
    productId: string,
    tagIds: string[],
  ): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    for (const tagId of tagIds) {
      await this.getTagById(tagId); // validate tag exists
      const tagIdVo = ProductTagId.fromString(tagId);
      const alreadyLinked = await this.tagAssociationRepository.exists(productIdVo, tagIdVo);
      if (!alreadyLinked) {
        const association = ProductTagAssociation.create({
          id: randomUUID(),
          productId,
          tagId,
        });
        await this.tagAssociationRepository.save(association);
      }
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
    options?: { limit?: number; offset?: number },
  ): Promise<string[]> {
    await this.getTagById(tagId); // validate tag exists
    const tagIdVo = ProductTagId.fromString(tagId);
    const associations = await this.tagAssociationRepository.findByTagId(tagIdVo, options);
    return associations.map((a) => a.productId.getValue());
  }

  // Private helper — returns domain entity for internal mutation
  private async findTagById(id: string): Promise<ProductTag> {
    const tagId = ProductTagId.fromString(id);
    const tag = await this.productTagRepository.findById(tagId);
    if (!tag) {
      throw new ProductTagNotFoundError(id);
    }
    return tag;
  }

  // Private validation methods
  private validateTagFormat(tag: string): void {
    if (!tag || tag.trim().length === 0) {
      throw new DomainValidationError("Tag cannot be empty");
    }

    if (tag.trim().length > 50) {
      throw new DomainValidationError("Tag cannot be longer than 50 characters");
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
      throw new DomainValidationError(
        "Tag can only contain letters, numbers, spaces, hyphens, and underscores",
      );
    }
  }
}
