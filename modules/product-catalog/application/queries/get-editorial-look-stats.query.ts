import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetEditorialLookStatsQuery extends IQuery {}

export interface EditorialLookStatsResult {
  totalLooks: number;
  publishedLooks: number;
  scheduledLooks: number;
  draftLooks: number;
  looksWithHeroImage: number;
  looksWithProducts: number;
  looksWithContent: number;
}

export class GetEditorialLookStatsHandler implements IQueryHandler<GetEditorialLookStatsQuery, EditorialLookStatsResult> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(_query: GetEditorialLookStatsQuery): Promise<EditorialLookStatsResult> {
    return await this.editorialLookManagementService.getEditorialLookStats();
  }
}
