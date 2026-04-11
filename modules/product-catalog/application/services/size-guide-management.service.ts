import {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "../../domain/repositories/size-guide.repository";
import {
  SizeGuide,
  SizeGuideDTO,
  SizeGuideId,
  Region,
} from "../../domain/entities/size-guide.entity";

type CreateSizeGuideData = { title: string; bodyHtml?: string; region: Region; category?: string };
import {
  SizeGuideNotFoundError,
  DomainValidationError,
} from "../../domain/errors";

export class SizeGuideManagementService {
  constructor(private readonly sizeGuideRepository: ISizeGuideRepository) {}

  // Core CRUD operations
  async createSizeGuide(data: CreateSizeGuideData): Promise<SizeGuideDTO> {
    // Validate region-category combination for uniqueness
    if (data.category) {
      const existingGuide =
        await this.sizeGuideRepository.findByRegionAndCategory(
          data.region,
          data.category,
        );
      if (existingGuide) {
        throw new DomainValidationError(
          `Size guide already exists for region "${data.region}" and category "${data.category}"`,
        );
      }
    }

    // Validate title format
    this.validateTitle(data.title);

    // Validate HTML content if provided
    if (data.bodyHtml) {
      this.validateHtmlContent(data.bodyHtml);
    }

    const sizeGuide = SizeGuide.create(data);
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
    updates: {
      title?: string;
      bodyHtml?: string;
      region?: Region;
      category?: string;
    },
  ): Promise<SizeGuideDTO> {
    const sizeGuide = await this.findSizeGuideById(id);

    // Validate title if provided
    if (updates.title !== undefined) {
      this.validateTitle(updates.title);
      sizeGuide.updateTitle(updates.title);
    }

    // Validate and update HTML content if provided
    if (updates.bodyHtml !== undefined) {
      if (updates.bodyHtml) {
        this.validateHtmlContent(updates.bodyHtml);
      }
      sizeGuide.updateBodyHtml(updates.bodyHtml);
    }

    // Update region if provided
    if (updates.region !== undefined) {
      // Check if the new region-category combination already exists
      const targetCategory =
        updates.category !== undefined
          ? updates.category
          : sizeGuide.category;
      if (targetCategory) {
        const existingGuide =
          await this.sizeGuideRepository.findByRegionAndCategory(
            updates.region,
            targetCategory,
          );
        if (existingGuide && !existingGuide.id.equals(sizeGuide.id)) {
          throw new DomainValidationError(
            `Size guide already exists for region "${updates.region}" and category "${targetCategory}"`,
          );
        }
      }
      sizeGuide.updateRegion(updates.region);
    }

    // Update category if provided
    if (updates.category !== undefined) {
      const targetRegion =
        updates.region !== undefined ? updates.region : sizeGuide.region;
      if (updates.category) {
        const existingGuide =
          await this.sizeGuideRepository.findByRegionAndCategory(
            targetRegion,
            updates.category,
          );
        if (existingGuide && !existingGuide.id.equals(sizeGuide.id)) {
          throw new DomainValidationError(
            `Size guide already exists for region "${targetRegion}" and category "${updates.category}"`,
          );
        }
      }
      sizeGuide.updateCategory(updates.category);
    }

    await this.sizeGuideRepository.update(sizeGuide);
    return SizeGuide.toDTO(sizeGuide);
  }

  async deleteSizeGuide(id: string): Promise<void> {
    const sizeGuideId = SizeGuideId.fromString(id);

    if (!(await this.sizeGuideRepository.exists(sizeGuideId))) {
      throw new SizeGuideNotFoundError(id);
    }

    await this.sizeGuideRepository.delete(sizeGuideId);
  }

  // Region-specific operations
  async createRegionalSizeGuide(
    region: Region,
    data: Omit<CreateSizeGuideData, "region">,
  ): Promise<SizeGuideDTO> {
    return this.createSizeGuide({ ...data, region });
  }

  async getAvailableRegions(): Promise<Region[]> {
    return [Region.UK, Region.US, Region.EU];
  }

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

  // Category-specific operations
  async createCategorySizeGuide(
    category: string,
    region: Region,
    data: Omit<CreateSizeGuideData, "category" | "region">,
  ): Promise<SizeGuideDTO> {
    return this.createSizeGuide({ ...data, category, region });
  }

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

  // Content management
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
    this.validateHtmlContent(htmlContent);
    return this.updateSizeGuide(id, { bodyHtml: htmlContent });
  }

  async clearSizeGuideContent(id: string): Promise<SizeGuideDTO> {
    return this.updateSizeGuide(id, { bodyHtml: undefined });
  }

  // Analytics and statistics
  async getSizeGuideStats(): Promise<{
    totalGuides: number;
    guidesByRegion: Array<{ region: Region; count: number }>;
    guidesByCategory: Array<{ category: string | null; count: number }>;
    guidesWithContent: number;
    guidesWithoutContent: number;
  }> {
    const totalGuides = await this.sizeGuideRepository.count();

    // Count by region
    const regions = await this.getAvailableRegions();
    const guidesByRegion = await Promise.all(
      regions.map(async (region: Region) => ({
        region,
        count: await this.sizeGuideRepository.count({ region }),
      })),
    );

    // Count by category
    const allGuides = await this.sizeGuideRepository.findAll();
    const categoryGroups = new Map<string | null, number>();

    for (const guide of allGuides) {
      const category = guide.category;
      categoryGroups.set(category, (categoryGroups.get(category) || 0) + 1);
    }

    const guidesByCategory = Array.from(categoryGroups.entries()).map(
      ([category, count]) => ({
        category,
        count,
      }),
    );

    const guidesWithContent = await this.sizeGuideRepository.count({
      hasContent: true,
    });
    const guidesWithoutContent = await this.sizeGuideRepository.count({
      hasContent: false,
    });

    return {
      totalGuides,
      guidesByRegion,
      guidesByCategory,
      guidesWithContent,
      guidesWithoutContent,
    };
  }

  // Bulk operations
  async createMultipleSizeGuides(guidesData: CreateSizeGuideData[]): Promise<{
    created: SizeGuideDTO[];
    skipped: Array<{ title: string; reason: string }>;
  }> {
    const createdGuides: SizeGuideDTO[] = [];
    const skipped: Array<{ title: string; reason: string }> = [];

    for (const data of guidesData) {
      try {
        const guide = await this.createSizeGuide(data);
        createdGuides.push(guide);
      } catch (error) {
        skipped.push({
          title: data.title,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created: createdGuides, skipped };
  }

  async deleteMultipleSizeGuides(ids: string[]): Promise<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
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

  // Validation methods
  async validateSizeGuideUniqueness(
    region: Region,
    category: string | null,
  ): Promise<boolean> {
    if (!category) return true; // General guides can have duplicates

    const existingGuide =
      await this.sizeGuideRepository.findByRegionAndCategory(region, category);
    return !existingGuide;
  }

  // Utility methods
  async getSizeGuideCount(options?: SizeGuideCountOptions): Promise<number> {
    return await this.sizeGuideRepository.count(options);
  }

  // Private helper — returns domain entity for internal mutation
  private async findSizeGuideById(id: string): Promise<SizeGuide> {
    const sizeGuideId = SizeGuideId.fromString(id);
    const sizeGuide = await this.sizeGuideRepository.findById(sizeGuideId);
    if (!sizeGuide) {
      throw new SizeGuideNotFoundError(id);
    }
    return sizeGuide;
  }

  // Private validation methods
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new DomainValidationError("Size guide title cannot be empty");
    }

    if (title.trim().length > 200) {
      throw new DomainValidationError(
        "Size guide title cannot be longer than 200 characters",
      );
    }
  }

  private validateHtmlContent(htmlContent: string): void {
    if (htmlContent.length > 50000) {
      throw new DomainValidationError(
        "Size guide content cannot exceed 50,000 characters",
      );
    }

    // Basic HTML validation - check for balanced tags
    const tagPattern = /<(\/?[^>]+)>/g;
    const openTags: string[] = [];
    let match;

    while ((match = tagPattern.exec(htmlContent)) !== null) {
      const tag = match[1];

      if (tag.startsWith("/")) {
        const closingTag = tag.substring(1);
        const lastOpenTag = openTags.pop();
        if (lastOpenTag !== closingTag) {
          throw new DomainValidationError(
            `Unmatched HTML tag: expected closing </${lastOpenTag}> but found </${closingTag}>`,
          );
        }
      } else if (!tag.endsWith("/")) {
        openTags.push(tag.split(" ")[0]); // Handle tags with attributes
      }
    }

    if (openTags.length > 0) {
      throw new DomainValidationError(
        `Unclosed HTML tags: ${openTags.join(", ")}`,
      );
    }
  }
}
