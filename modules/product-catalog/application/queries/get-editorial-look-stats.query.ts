import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { EditorialLookManagementService } from "../services/editorial-look-management.service";

export interface GetEditorialLookStatsQuery extends IQuery {}

export interface EditorialLookStatsResult {
  readonly totalLooks: number;
  readonly publishedLooks: number;
  readonly scheduledLooks: number;
  readonly draftLooks: number;
  readonly looksWithHeroImage: number;
  readonly looksWithProducts: number;
  readonly looksWithContent: number;
}

export class GetEditorialLookStatsHandler implements IQueryHandler<GetEditorialLookStatsQuery, EditorialLookStatsResult> {
  constructor(private readonly editorialLookManagementService: EditorialLookManagementService) {}

  async handle(_query: GetEditorialLookStatsQuery): Promise<EditorialLookStatsResult> {
    return this.editorialLookManagementService.getEditorialLookStats();
  }
}
