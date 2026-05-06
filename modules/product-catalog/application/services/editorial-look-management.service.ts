import {
  IEditorialLookRepository,
  EditorialLookQueryOptions,
  EditorialLookCountOptions,
} from "../../domain/repositories/editorial-look.repository";
import { IMediaAssetRepository } from "../../domain/repositories/media-asset.repository";
import { IProductRepository } from "../../domain/repositories/product.repository";
import {
  EditorialLook,
  EditorialLookDTO,
  CreateEditorialLookData,
} from "../../domain/entities/editorial-look.entity";
import { EditorialLookId } from "../../domain/value-objects/editorial-look-id.vo";
import { MediaAssetId } from "../../domain/value-objects/media-asset-id.vo";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { IHtmlSanitizer } from "./ihtml-sanitizer.service";
import {
  ProductNotFoundError,
  EditorialLookNotFoundError,
  MediaAssetNotFoundError,
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Result types (named, not anonymous) ────────────────────────────────

export interface EditorialLookStats {
  totalLooks: number;
  publishedLooks: number;
  scheduledLooks: number;
  draftLooks: number;
  looksWithHeroImage: number;
  looksWithProducts: number;
  looksWithContent: number;
}

export interface PopularProduct {
  productId: string;
  appearanceCount: number;
}

export interface ScheduledPublicationResult {
  published: EditorialLookDTO[];
  errors: string[];
}

export interface PublicationValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BatchDeleteResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface BatchPublishResult {
  published: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface UpdateEditorialLookInput {
  title?: string;
  storyHtml?: string | null;
  heroAssetId?: string | null;
  publishedAt?: Date | null;
}

export interface EditorialLookFilters {
  published?: boolean;
  scheduled?: boolean;
  draft?: boolean;
  hasContent?: boolean;
}

export interface EditorialLookListOptions {
  page?: number;
  limit?: number;
  sortBy?: "title" | "publishedAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface LooksByProductOptions extends EditorialLookListOptions {
  includeUnpublished?: boolean;
}

export class EditorialLookManagementService {
  constructor(
    private readonly editorialLookRepository: IEditorialLookRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly productRepository: IProductRepository,
    private readonly htmlSanitizer: IHtmlSanitizer,
  ) {}

  // ── Core CRUD ────────────────────────────────────────────────────────

  async createEditorialLook(
    data: CreateEditorialLookData,
  ): Promise<EditorialLookDTO> {
    if (data.heroAssetId) {
      await this.assertHeroAssetIsImage(data.heroAssetId);
    }

    if (data.productIds && data.productIds.length > 0) {
      await this.assertProductsExist(data.productIds);
    }

    const look = EditorialLook.create({
      ...data,
      title: this.htmlSanitizer.sanitizeTitle(data.title),
      storyHtml: data.storyHtml ? this.htmlSanitizer.sanitize(data.storyHtml) : undefined,
    });
    await this.editorialLookRepository.save(look);
    return EditorialLook.toDTO(look);
  }

  async getEditorialLookById(id: string): Promise<EditorialLookDTO> {
    return EditorialLook.toDTO(await this.getLook(id));
  }

  async getAllEditorialLooks(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const looks = await this.editorialLookRepository.findAll(options);
    return looks.map(EditorialLook.toDTO);
  }

  async getPublishedLooks(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const looks = await this.editorialLookRepository.findPublished(options);
    return looks.map(EditorialLook.toDTO);
  }

  async getScheduledLooks(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const looks = await this.editorialLookRepository.findScheduled(options);
    return looks.map(EditorialLook.toDTO);
  }

  async getDraftLooks(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const looks = await this.editorialLookRepository.findDrafts(options);
    return looks.map(EditorialLook.toDTO);
  }

  // Consolidates the routing previously done in handlers (published/scheduled/
  // draft/hasContent branches). Returns the canonical PaginatedResult shape.
  async findWithFilters(
    filters: EditorialLookFilters,
    options: EditorialLookListOptions = {},
  ): Promise<PaginatedResult<EditorialLookDTO>> {
    const { page = 1, limit = 20, sortBy = "id", sortOrder = "desc" } = options;
    const offset = (page - 1) * limit;
    const queryOptions: EditorialLookQueryOptions = { limit, offset, sortBy, sortOrder };

    let looks: EditorialLook[];
    let total: number;

    if (filters.published === true) {
      [looks, total] = await Promise.all([
        this.editorialLookRepository.findPublished(queryOptions),
        this.editorialLookRepository.count({ published: true }),
      ]);
    } else if (filters.scheduled === true) {
      [looks, total] = await Promise.all([
        this.editorialLookRepository.findScheduled(queryOptions),
        this.editorialLookRepository.count({ scheduled: true }),
      ]);
    } else if (filters.draft === true) {
      [looks, total] = await Promise.all([
        this.editorialLookRepository.findDrafts(queryOptions),
        this.editorialLookRepository.count({ draft: true }),
      ]);
    } else if (filters.hasContent !== undefined) {
      // PERF: hasContent is JS-side because the repo doesn't expose it as a count
      // option. Fetch all, filter, then paginate. Replace with a repo-side
      // hasContent filter when look counts grow.
      const allLooks = await this.editorialLookRepository.findAll();
      const matching = allLooks.filter((l) => l.hasStory() === filters.hasContent);
      total = matching.length;
      looks = matching.slice(offset, offset + limit);
    } else {
      [looks, total] = await Promise.all([
        this.editorialLookRepository.findAll(queryOptions),
        this.editorialLookRepository.count(),
      ]);
    }

    return {
      items: looks.map(EditorialLook.toDTO),
      total,
      limit,
      offset,
      hasMore: offset + looks.length < total,
    };
  }

  async updateEditorialLook(
    id: string,
    updates: UpdateEditorialLookInput,
  ): Promise<EditorialLookDTO> {
    const look = await this.getLook(id);

    if (updates.title !== undefined) {
      look.updateTitle(this.htmlSanitizer.sanitizeTitle(updates.title));
    }

    if (updates.storyHtml !== undefined) {
      const safeStoryHtml = updates.storyHtml
        ? this.htmlSanitizer.sanitize(updates.storyHtml)
        : updates.storyHtml;
      look.updateStoryHtml(safeStoryHtml);
    }

    if (updates.heroAssetId !== undefined) {
      if (updates.heroAssetId !== null) {
        await this.assertHeroAssetIsImage(updates.heroAssetId);
      }
      look.setHeroAsset(updates.heroAssetId);
    }

    if (updates.publishedAt !== undefined) {
      if (updates.publishedAt) {
        // Only enforce future date if look is not already published
        if (!look.isPublished() && updates.publishedAt <= new Date()) {
          throw new DomainValidationError(
            "Publication date must be in the future for scheduled publication",
          );
        }
        look.schedulePublication(updates.publishedAt);
      } else {
        look.unpublish();
      }
    }

    await this.editorialLookRepository.save(look);
    return EditorialLook.toDTO(look);
  }

  async deleteEditorialLook(id: string): Promise<void> {
    const lookId = EditorialLookId.fromString(id);

    if (!(await this.editorialLookRepository.exists(lookId))) {
      throw new EditorialLookNotFoundError(id);
    }

    await this.editorialLookRepository.delete(lookId);
  }

  // ── Publishing workflow ──────────────────────────────────────────────

  async publishLook(id: string): Promise<EditorialLookDTO> {
    const look = await this.getLook(id);

    if (!look.canBePublished()) {
      throw new InvalidOperationError(
        "Editorial look cannot be published: missing title or hero image",
      );
    }

    look.publish();
    await this.editorialLookRepository.save(look);

    return EditorialLook.toDTO(look);
  }

  async unpublishLook(id: string): Promise<EditorialLookDTO> {
    const look = await this.getLook(id);
    look.unpublish();
    await this.editorialLookRepository.save(look);

    return EditorialLook.toDTO(look);
  }

  async scheduleLookPublication(
    id: string,
    publishDate: Date,
  ): Promise<EditorialLookDTO> {
    if (publishDate <= new Date()) {
      throw new DomainValidationError("Publication date must be in the future");
    }

    const look = await this.getLook(id);

    if (!look.canBePublished()) {
      throw new InvalidOperationError(
        "Editorial look cannot be scheduled: missing title or hero image",
      );
    }

    look.schedulePublication(publishDate);
    await this.editorialLookRepository.save(look);

    return EditorialLook.toDTO(look);
  }

  async getReadyToPublishLooks(): Promise<EditorialLookDTO[]> {
    const looks = await this.editorialLookRepository.findReadyToPublish();
    return looks.map(EditorialLook.toDTO);
  }

  async processScheduledPublications(): Promise<ScheduledPublicationResult> {
    const readyLooks = await this.editorialLookRepository.findReadyToPublish();
    const published: EditorialLookDTO[] = [];
    const errors: string[] = [];

    for (const look of readyLooks) {
      try {
        if (look.canBePublished()) {
          look.publish();
          await this.editorialLookRepository.save(look);
          published.push(EditorialLook.toDTO(look));
        }
      } catch (error) {
        errors.push(
          `Failed to publish look ${look.id.getValue()}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return { published, errors };
  }

  // ── Hero image management ────────────────────────────────────────────

  async setHeroImage(id: string, assetId: string): Promise<EditorialLookDTO> {
    const look = await this.getLook(id);
    await this.assertHeroAssetIsImage(assetId);
    look.setHeroAsset(assetId);
    await this.editorialLookRepository.save(look);
    return EditorialLook.toDTO(look);
  }

  async removeHeroImage(id: string): Promise<EditorialLookDTO> {
    const look = await this.getLook(id);
    look.setHeroAsset(null);
    await this.editorialLookRepository.save(look);
    return EditorialLook.toDTO(look);
  }

  async getLooksByHeroAsset(assetId: string): Promise<EditorialLookDTO[]> {
    const mediaAssetId = MediaAssetId.fromString(assetId);
    const looks = await this.editorialLookRepository.findByHeroAsset(mediaAssetId);
    return looks.map(EditorialLook.toDTO);
  }

  // ── Product association management ───────────────────────────────────

  async addProductToLook(lookId: string, productId: string): Promise<void> {
    await this.assertProductExists(productId);

    const look = await this.getLook(lookId);

    if (look.includesProduct(productId)) {
      throw new InvalidOperationError(
        `Product "${productId}" is already associated with this editorial look`,
      );
    }

    look.addProduct(productId);
    await this.editorialLookRepository.save(look);
  }

  async removeProductFromLook(
    lookId: string,
    productId: string,
  ): Promise<void> {
    const look = await this.getLook(lookId);

    if (!look.includesProduct(productId)) {
      throw new InvalidOperationError(
        `Product "${productId}" is not associated with look "${lookId}"`,
      );
    }

    look.removeProduct(productId);
    await this.editorialLookRepository.save(look);
  }

  async setLookProducts(
    id: string,
    productIds: string[],
  ): Promise<EditorialLookDTO> {
    await this.assertProductsExist(productIds);

    const look = await this.getLook(id);
    look.setProducts(productIds);
    await this.editorialLookRepository.save(look);

    return EditorialLook.toDTO(look);
  }

  async getLookProducts(id: string): Promise<string[]> {
    const look = await this.getLook(id);
    return look.productIds.map((pid) => pid.getValue());
  }

  async getProductLooks(productId: string): Promise<string[]> {
    const productIdVo = ProductId.fromString(productId);
    await this.assertProductExists(productId);

    const looks = await this.editorialLookRepository.findByProductId(productIdVo);
    return looks.map((l) => l.id.getValue());
  }

  async getLooksByProduct(
    productId: string,
    options: LooksByProductOptions = {},
  ): Promise<PaginatedResult<EditorialLookDTO>> {
    const { page = 1, limit = 20, sortBy = "id", sortOrder = "desc", includeUnpublished } = options;
    const offset = (page - 1) * limit;

    const allLooks = await this.editorialLookRepository.findByProductId(
      ProductId.fromString(productId),
      { sortBy, sortOrder, includeUnpublished },
    );
    const total = allLooks.length;
    const items = allLooks.slice(offset, offset + limit).map(EditorialLook.toDTO);

    return { items, total, limit, offset, hasMore: offset + items.length < total };
  }

  // ── Content management ──────────────────────────────────────────────

  async updateStoryContent(
    id: string,
    storyHtml: string,
  ): Promise<EditorialLookDTO> {
    return this.updateEditorialLook(id, { storyHtml });
  }

  async clearStoryContent(id: string): Promise<EditorialLookDTO> {
    return this.updateEditorialLook(id, { storyHtml: null });
  }

  // PERF: filtering in JS — should be a repo-level filter (e.g. `hasContent: true`).
  async getLooksWithContent(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const allLooks = await this.editorialLookRepository.findAll(options);
    return allLooks.filter((look) => look.hasStory()).map(EditorialLook.toDTO);
  }

  // PERF: filtering in JS — should be a repo-level filter (e.g. `hasContent: false`).
  async getLooksWithoutContent(
    options?: EditorialLookQueryOptions,
  ): Promise<EditorialLookDTO[]> {
    const allLooks = await this.editorialLookRepository.findAll(options);
    return allLooks.filter((look) => !look.hasStory()).map(EditorialLook.toDTO);
  }

  // ── Analytics & statistics ──────────────────────────────────────────

  // PERF: `looksWithContent` requires fetching all looks; rest are parallel counts.
  async getEditorialLookStats(): Promise<EditorialLookStats> {
    const [
      totalLooks,
      publishedLooks,
      scheduledLooks,
      draftLooks,
      looksWithHeroImage,
      looksWithProducts,
      allLooks,
    ] = await Promise.all([
      this.editorialLookRepository.count(),
      this.editorialLookRepository.count({ published: true }),
      this.editorialLookRepository.count({ scheduled: true }),
      this.editorialLookRepository.count({ draft: true }),
      this.editorialLookRepository.count({ hasHeroImage: true }),
      this.editorialLookRepository.count({ hasProducts: true }),
      this.editorialLookRepository.findAll(),
    ]);

    const looksWithContent = allLooks.filter((look) => look.hasStory()).length;

    return {
      totalLooks,
      publishedLooks,
      scheduledLooks,
      draftLooks,
      looksWithHeroImage,
      looksWithProducts,
      looksWithContent,
    };
  }

  // PERF: aggregates in JS over all looks; replace with SQL `groupBy` when looks scale.
  async getPopularProducts(limit: number = 10): Promise<PopularProduct[]> {
    const allLooks = await this.getAllEditorialLooks();
    const productCounts = new Map<string, number>();

    for (const look of allLooks) {
      for (const productId of look.productIds) {
        productCounts.set(productId, (productCounts.get(productId) ?? 0) + 1);
      }
    }

    return Array.from(productCounts.entries())
      .map(([productId, appearanceCount]) => ({ productId, appearanceCount }))
      .sort((a, b) => b.appearanceCount - a.appearanceCount)
      .slice(0, limit);
  }

  // ── Bulk operations ─────────────────────────────────────────────────

  async createMultipleEditorialLooks(
    looksData: CreateEditorialLookData[],
  ): Promise<EditorialLookDTO[]> {
    const createdLooks: EditorialLookDTO[] = [];
    const errors: string[] = [];

    for (const data of looksData) {
      try {
        const look = await this.createEditorialLook(data);
        createdLooks.push(look);
      } catch (error) {
        errors.push(
          `Failed to create editorial look "${data.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (errors.length > 0 && createdLooks.length === 0) {
      throw new InvalidOperationError(
        `Failed to create any editorial looks: ${errors.join(", ")}`,
      );
    }

    return createdLooks;
  }

  async deleteMultipleEditorialLooks(ids: string[]): Promise<BatchDeleteResult> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.deleteEditorialLook(id);
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

  async publishMultipleLooks(ids: string[]): Promise<BatchPublishResult> {
    const published: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.publishLook(id);
        published.push(id);
      } catch (error) {
        failed.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { published, failed };
  }

  // ── Validation helpers (public) ─────────────────────────────────────

  async validateLookForPublication(
    id: string,
  ): Promise<PublicationValidationResult> {
    const look = await this.getLook(id);
    const errors: string[] = [];

    if (!look.title.trim()) {
      errors.push("Title is required");
    }

    if (!look.hasHeroImage()) {
      errors.push("Hero image is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ── Utility ─────────────────────────────────────────────────────────

  async getEditorialLookCount(
    options?: EditorialLookCountOptions,
  ): Promise<number> {
    return this.editorialLookRepository.count(options);
  }

  async duplicateEditorialLook(
    id: string,
    newTitle: string,
  ): Promise<EditorialLookDTO> {
    const original = await this.getLook(id);

    return this.createEditorialLook({
      title: newTitle,
      storyHtml: original.storyHtml ?? undefined,
      heroAssetId: original.heroAssetId?.getValue() ?? undefined,
      productIds: original.productIds.map((pid) => pid.getValue()),
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async getLook(id: string): Promise<EditorialLook> {
    const lookId = EditorialLookId.fromString(id);
    const look = await this.editorialLookRepository.findById(lookId);
    if (!look) {
      throw new EditorialLookNotFoundError(id);
    }
    return look;
  }

  private async assertHeroAssetIsImage(assetId: string): Promise<void> {
    const heroAssetId = MediaAssetId.fromString(assetId);
    const asset = await this.mediaAssetRepository.findById(heroAssetId);
    if (!asset) {
      throw new MediaAssetNotFoundError(assetId);
    }
    if (!asset.isImage()) {
      throw new InvalidOperationError("Hero asset must be an image");
    }
  }

  private async assertProductExists(productId: string): Promise<void> {
    const productIdVo = ProductId.fromString(productId);
    const product = await this.productRepository.findById(productIdVo);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
  }

  // Single batched query instead of N findById calls.
  private async assertProductsExist(productIds: string[]): Promise<void> {
    if (productIds.length === 0) return;

    const ids = productIds.map((id) => ProductId.fromString(id));
    const found = await this.productRepository.findByIds(ids);

    if (found.length === productIds.length) return;

    const foundIds = new Set(found.map((p) => p.id.getValue()));
    const missing = productIds.filter((id) => !foundIds.has(id));
    throw new ProductNotFoundError(missing[0]);
  }
}
