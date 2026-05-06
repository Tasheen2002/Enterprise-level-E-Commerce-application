import {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "../../domain/repositories/size-guide.repository";
import { SizeGuide, SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { SizeGuideId } from "../../domain/value-objects/size-guide-id.vo";
import { Region } from "../../domain/value-objects";
import { IHtmlSanitizer } from "./ihtml-sanitizer.service";
import {
  SizeGuideNotFoundError,
  DomainValidationError,
} from "../../domain/errors";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";

// ── Input / result types ──────────────────────────────────────────────

export interface CreateSizeGuideData {
  title: string;
  bodyHtml?: string;
  region: Region;
  category?: string;
}

export interface UpdateSizeGuideInput {
  title?: string;
  bodyHtml?: string;
  region?: Region;
  category?: string;
}

export interface RegionCount {
  region: Region;
  count: number;
}

export interface CategoryCount {
  category: string | null;
  count: number;
}

export interface SizeGuideStats {
  totalGuides: number;
  guidesByRegion: RegionCount[];
  guidesByCategory: CategoryCount[];
  guidesWithContent: number;
  guidesWithoutContent: number;
}

export interface BatchCreateSizeGuideResult {
  created: SizeGuideDTO[];
  skipped: Array<{ title: string; reason: string }>;
}

export interface BatchDeleteSizeGuideResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface SizeGuideFilters {
  region?: Region;
  category?: string;
  hasContent?: boolean;
}

export interface SizeGuideListOptions {
  page?: number;
  limit?: number;
  sortBy?: "title" | "region" | "category";
  sortOrder?: "asc" | "desc";
}

// ── Service ───────────────────────────────────────────────────────────

export class SizeGuideManagementService {
  constructor(
    private readonly sizeGuideRepository: ISizeGuideRepository,
    private readonly htmlSanitizer: IHtmlSanitizer,
  ) {}

  // ── Core CRUD ────────────────────────────────────────────────────────

  async createSizeGuide(data: CreateSizeGuideData): Promise<SizeGuideDTO> {
    if (data.category) {
      await this.assertRegionCategoryAvailable(data.region, data.category);
    }

    const sizeGuide = SizeGuide.create({
      ...data,
      title: this.htmlSanitizer.sanitizeTitle(data.title),
      bodyHtml: data.bodyHtml ? this.htmlSanitizer.sanitize(data.bodyHtml) : undefined,
    });
    await this.sizeGuideRepository.save(sizeGuide);

    return SizeGuide.toDTO(sizeGuide);
  }

  async getSizeGuideById(id: string): Promise<SizeGuideDTO> {
    return SizeGuide.toDTO(await this.findSizeGuideById(id));
  }

  async getAllSizeGuides(
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findAll(options);
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  // Consolidates the routing previously done in handlers (region/category/hasContent
  // branches). Returns the canonical PaginatedResult shape for all paths.
  async findWithFilters(
    filters: SizeGuideFilters,
    options: SizeGuideListOptions = {},
  ): Promise<PaginatedResult<SizeGuideDTO>> {
    const { page = 1, limit = 20, sortBy = "title", sortOrder = "desc" } = options;
    const offset = (page - 1) * limit;

    // Region + category resolves to a single guide (unique by composite key).
    if (filters.region && filters.category) {
      const guide = await this.sizeGuideRepository.findByRegionAndCategory(
        filters.region,
        filters.category,
      );
      const items = guide ? [SizeGuide.toDTO(guide)] : [];
      return { items, total: items.length, limit, offset: 0, hasMore: false };
    }

    const queryOptions: SizeGuideQueryOptions = {
      limit,
      offset,
      sortBy,
      sortOrder,
      hasContent: filters.hasContent,
    };
    const countOptions: SizeGuideCountOptions = {
      region: filters.region,
      category: filters.category,
      hasContent: filters.hasContent,
    };

    let findPromise: Promise<SizeGuide[]>;
    if (filters.region) {
      findPromise = this.sizeGuideRepository.findByRegion(filters.region, queryOptions);
    } else if (filters.category) {
      findPromise = this.sizeGuideRepository.findByCategory(filters.category, queryOptions);
    } else {
      findPromise = this.sizeGuideRepository.findAll(queryOptions);
    }

    const [guides, total] = await Promise.all([
      findPromise,
      this.sizeGuideRepository.count(countOptions),
    ]);

    return {
      items: guides.map((g) => SizeGuide.toDTO(g)),
      total,
      limit,
      offset,
      hasMore: offset + guides.length < total,
    };
  }

  async getSizeGuidesByRegion(
    region: Region,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findByRegion(region, options);
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  async getSizeGuidesByCategory(
    category: string,
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findByCategory(category, options);
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  async getSizeGuideByRegionAndCategory(
    region: Region,
    category: string,
  ): Promise<SizeGuideDTO> {
    const guide = await this.sizeGuideRepository.findByRegionAndCategory(
      region,
      category,
    );
    if (!guide) {
      throw new SizeGuideNotFoundError(`${region}:${category}`);
    }
    return SizeGuide.toDTO(guide);
  }

  async getGeneralSizeGuides(region: Region): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findGeneral(region);
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  async updateSizeGuide(
    id: string,
    updates: UpdateSizeGuideInput,
  ): Promise<SizeGuideDTO> {
    const sizeGuide = await this.findSizeGuideById(id);

    if (updates.title !== undefined) {
      sizeGuide.updateTitle(this.htmlSanitizer.sanitizeTitle(updates.title));
    }

    if (updates.bodyHtml !== undefined) {
      const safeBody = updates.bodyHtml
        ? this.htmlSanitizer.sanitize(updates.bodyHtml)
        : updates.bodyHtml;
      sizeGuide.updateBodyHtml(safeBody);
    }

    // Single combined uniqueness check when region or category changes
    if (updates.region !== undefined || updates.category !== undefined) {
      const targetRegion = updates.region ?? sizeGuide.region;
      const targetCategory =
        updates.category !== undefined ? updates.category : sizeGuide.category;

      if (targetCategory) {
        await this.assertRegionCategoryAvailable(
          targetRegion,
          targetCategory,
          sizeGuide.id,
        );
      }
    }

    if (updates.region !== undefined) {
      sizeGuide.updateRegion(updates.region);
    }

    if (updates.category !== undefined) {
      sizeGuide.updateCategory(updates.category);
    }

    await this.sizeGuideRepository.save(sizeGuide);
    return SizeGuide.toDTO(sizeGuide);
  }

  async deleteSizeGuide(id: string): Promise<void> {
    const sizeGuideId = SizeGuideId.fromString(id);

    if (!(await this.sizeGuideRepository.exists(sizeGuideId))) {
      throw new SizeGuideNotFoundError(id);
    }

    await this.sizeGuideRepository.delete(sizeGuideId);
  }

  // ── Region-specific operations ───────────────────────────────────────

  async createRegionalSizeGuide(
    region: Region,
    data: Omit<CreateSizeGuideData, "region">,
  ): Promise<SizeGuideDTO> {
    return this.createSizeGuide({ ...data, region });
  }

  async getAvailableRegions(): Promise<Region[]> {
    return Region.getAllValues();
  }

  // PERF: N queries (one per region). Acceptable while region count is bounded;
  // replace with `findByRegions(regions[])` (WHERE region IN ...) if it grows.
  async getSizeGuidesByRegions(
    regions: Region[],
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const allGuides: SizeGuideDTO[] = [];

    for (const region of regions) {
      const regionGuides = await this.getSizeGuidesByRegion(region, options);
      allGuides.push(...regionGuides);
    }

    return allGuides;
  }

  // ── Category-specific operations ─────────────────────────────────────

  async createCategorySizeGuide(
    category: string,
    region: Region,
    data: Omit<CreateSizeGuideData, "category" | "region">,
  ): Promise<SizeGuideDTO> {
    return this.createSizeGuide({ ...data, category, region });
  }

  // PERF: fetches all guides then computes distinct in JS.
  // Should be a `SELECT DISTINCT category` repo method.
  async getAvailableCategories(region?: Region): Promise<string[]> {
    const guides = region
      ? await this.sizeGuideRepository.findByRegion(region)
      : await this.sizeGuideRepository.findAll();

    const categories = new Set<string>();

    for (const guide of guides) {
      const category = guide.category;
      if (category) {
        categories.add(category);
      }
    }

    return Array.from(categories).sort();
  }

  // ── Content management ─────────────────────────────────────────────

  async getSizeGuidesWithContent(
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findAll({
      ...options,
      hasContent: true,
    });
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  async getSizeGuidesWithoutContent(
    options?: SizeGuideQueryOptions,
  ): Promise<SizeGuideDTO[]> {
    const guides = await this.sizeGuideRepository.findAll({
      ...options,
      hasContent: false,
    });
    return guides.map((g) => SizeGuide.toDTO(g));
  }

  async updateSizeGuideContent(
    id: string,
    htmlContent: string,
  ): Promise<SizeGuideDTO> {
    return this.updateSizeGuide(id, { bodyHtml: htmlContent });
  }

  async clearSizeGuideContent(id: string): Promise<SizeGuideDTO> {
    return this.updateSizeGuide(id, { bodyHtml: undefined });
  }

  // ── Analytics & statistics ─────────────────────────────────────────

  // PERF: `guidesByCategory` aggregates in JS; should be a SQL `groupBy(category)`.
  async getSizeGuideStats(): Promise<SizeGuideStats> {
    const regions = await this.getAvailableRegions();

    const [
      totalGuides,
      guidesByRegion,
      guidesWithContent,
      guidesWithoutContent,
      allGuides,
    ] = await Promise.all([
      this.sizeGuideRepository.count(),
      Promise.all(
        regions.map(async (region) => ({
          region,
          count: await this.sizeGuideRepository.count({ region }),
        })),
      ),
      this.sizeGuideRepository.count({ hasContent: true }),
      this.sizeGuideRepository.count({ hasContent: false }),
      this.sizeGuideRepository.findAll(),
    ]);

    const categoryGroups = new Map<string | null, number>();
    for (const guide of allGuides) {
      const category = guide.category;
      categoryGroups.set(category, (categoryGroups.get(category) ?? 0) + 1);
    }

    const guidesByCategory: CategoryCount[] = Array.from(
      categoryGroups.entries(),
    ).map(([category, count]) => ({ category, count }));

    return {
      totalGuides,
      guidesByRegion,
      guidesByCategory,
      guidesWithContent,
      guidesWithoutContent,
    };
  }

  // ── Bulk operations ─────────────────────────────────────────────────

  async createMultipleSizeGuides(
    guidesData: CreateSizeGuideData[],
  ): Promise<BatchCreateSizeGuideResult> {
    const created: SizeGuideDTO[] = [];
    const skipped: Array<{ title: string; reason: string }> = [];

    for (const data of guidesData) {
      try {
        const guide = await this.createSizeGuide(data);
        created.push(guide);
      } catch (error) {
        skipped.push({
          title: data.title,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created, skipped };
  }

  async deleteMultipleSizeGuides(
    ids: string[],
  ): Promise<BatchDeleteSizeGuideResult> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.deleteSizeGuide(id);
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

  async validateSizeGuideUniqueness(
    region: Region,
    category: string | null,
  ): Promise<boolean> {
    if (!category) return true; // General guides can have duplicates

    const existing = await this.sizeGuideRepository.findByRegionAndCategory(
      region,
      category,
    );
    return !existing;
  }

  // ── Utility ─────────────────────────────────────────────────────────

  async getSizeGuideCount(options?: SizeGuideCountOptions): Promise<number> {
    return this.sizeGuideRepository.count(options);
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async findSizeGuideById(id: string): Promise<SizeGuide> {
    const sizeGuideId = SizeGuideId.fromString(id);
    const sizeGuide = await this.sizeGuideRepository.findById(sizeGuideId);
    if (!sizeGuide) {
      throw new SizeGuideNotFoundError(id);
    }
    return sizeGuide;
  }

  // Race-prone soft check; the repo schema should also enforce this with a
  // unique (region, category) index. The global P2002 handler maps DB violations
  // to a 409 response.
  private async assertRegionCategoryAvailable(
    region: Region,
    category: string,
    excludeId?: SizeGuideId,
  ): Promise<void> {
    const existing = await this.sizeGuideRepository.findByRegionAndCategory(
      region,
      category,
    );
    if (existing && (!excludeId || !existing.id.equals(excludeId))) {
      throw new DomainValidationError(
        `Size guide already exists for region "${region}" and category "${category}"`,
      );
    }
  }
}
