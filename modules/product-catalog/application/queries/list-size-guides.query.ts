import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";
import { SizeGuideQueryOptions } from "../../domain/repositories/size-guide.repository";

export interface ListSizeGuidesQuery extends IQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly region?: Region;
  readonly category?: string;
  readonly hasContent?: boolean;
  readonly sortBy?: "title" | "region" | "category";
  readonly sortOrder?: "asc" | "desc";
}

export interface ListSizeGuidesResult {
  readonly sizeGuides: SizeGuideDTO[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly total_pages: number;
  };
}

export class ListSizeGuidesHandler implements IQueryHandler<ListSizeGuidesQuery, ListSizeGuidesResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: ListSizeGuidesQuery): Promise<ListSizeGuidesResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const serviceOptions: SizeGuideQueryOptions = {
      limit,
      offset: (page - 1) * limit,
      sortBy: query.sortBy ?? "title",
      sortOrder: query.sortOrder ?? "desc",
      hasContent: query.hasContent,
    };

    let guides: SizeGuideDTO[];
    if (query.region && query.category) {
      const guide = await this.sizeGuideManagementService.getSizeGuideByRegionAndCategory(query.region, query.category);
      guides = guide ? [guide] : [];
    } else if (query.region) {
      guides = await this.sizeGuideManagementService.getSizeGuidesByRegion(query.region, serviceOptions);
    } else if (query.category) {
      guides = await this.sizeGuideManagementService.getSizeGuidesByCategory(query.category, serviceOptions);
    } else if (query.hasContent !== undefined) {
      guides = query.hasContent
        ? await this.sizeGuideManagementService.getSizeGuidesWithContent(serviceOptions)
        : await this.sizeGuideManagementService.getSizeGuidesWithoutContent(serviceOptions);
    } else {
      guides = await this.sizeGuideManagementService.getAllSizeGuides(serviceOptions);
    }

    const sizeGuides = guides.filter(Boolean);

    return {
      sizeGuides,
      pagination: { page, limit, total: sizeGuides.length, total_pages: Math.ceil(sizeGuides.length / limit) },
    };
  }
}
