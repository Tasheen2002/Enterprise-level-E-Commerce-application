import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO, Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";
import { SizeGuideQueryOptions } from "../../domain/repositories/size-guide.repository";

export interface GetRegionalSizeGuidesQuery extends IQuery {
  region: Region;
  page?: number;
  limit?: number;
  category?: string;
  hasContent?: boolean;
  sortBy?: "title" | "region" | "category";
  sortOrder?: "asc" | "desc";
}

export interface RegionalSizeGuidesResult {
  sizeGuides: SizeGuideDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  meta: { region: Region; page: number; limit: number };
}

export class GetRegionalSizeGuidesHandler implements IQueryHandler<GetRegionalSizeGuidesQuery, RegionalSizeGuidesResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: GetRegionalSizeGuidesQuery): Promise<RegionalSizeGuidesResult> {
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
    if (query.category) {
      const guide = await this.sizeGuideManagementService.getSizeGuideByRegionAndCategory(query.region, query.category);
      guides = guide ? [guide] : [];
    } else {
      guides = await this.sizeGuideManagementService.getSizeGuidesByRegion(query.region, serviceOptions);
    }

    const sizeGuides = guides.filter(Boolean);

    return {
      sizeGuides,
      pagination: { page, limit, total: sizeGuides.length, total_pages: Math.ceil(sizeGuides.length / limit) },
      meta: { region: query.region, page, limit },
    };
  }
}
