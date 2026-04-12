import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetSizeGuideStatsQuery extends IQuery {}

export interface SizeGuideStatsResult {
  totalGuides: number;
  guidesByRegion: Array<{ region: Region; count: number }>;
  guidesByCategory: Array<{ category: string | null; count: number }>;
  guidesWithContent: number;
  guidesWithoutContent: number;
}

export class GetSizeGuideStatsHandler implements IQueryHandler<GetSizeGuideStatsQuery, SizeGuideStatsResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(_query: GetSizeGuideStatsQuery): Promise<SizeGuideStatsResult> {
    return await this.sizeGuideManagementService.getSizeGuideStats();
  }
}
