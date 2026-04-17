import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetSizeGuideStatsQuery extends IQuery {}

export interface SizeGuideStatsResult {
  readonly totalGuides: number;
  readonly guidesByRegion: Array<{ region: Region; count: number }>;
  readonly guidesByCategory: Array<{ category: string | null; count: number }>;
  readonly guidesWithContent: number;
  readonly guidesWithoutContent: number;
}

export class GetSizeGuideStatsHandler implements IQueryHandler<GetSizeGuideStatsQuery, SizeGuideStatsResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(_query: GetSizeGuideStatsQuery): Promise<SizeGuideStatsResult> {
    return this.sizeGuideManagementService.getSizeGuideStats();
  }
}
