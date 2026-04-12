import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO, Region } from "../../domain/entities/size-guide.entity";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetGeneralSizeGuidesQuery extends IQuery {
  region: Region;
}

export interface GeneralSizeGuidesResult {
  guides: SizeGuideDTO[];
  meta: { region: Region; count: number };
}

export class GetGeneralSizeGuidesHandler implements IQueryHandler<GetGeneralSizeGuidesQuery, GeneralSizeGuidesResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: GetGeneralSizeGuidesQuery): Promise<GeneralSizeGuidesResult> {
    const guides = await this.sizeGuideManagementService.getGeneralSizeGuides(query.region);
    return { guides, meta: { region: query.region, count: guides.length } };
  }
}
