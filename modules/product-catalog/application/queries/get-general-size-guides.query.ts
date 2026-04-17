import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { SizeGuideDTO } from "../../domain/entities/size-guide.entity";
import { Region } from "../../domain/enums/product-catalog.enums";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetGeneralSizeGuidesQuery extends IQuery {
  readonly region: Region;
}

export interface GeneralSizeGuidesResult {
  readonly guides: SizeGuideDTO[];
  readonly meta: { region: Region; count: number };
}

export class GetGeneralSizeGuidesHandler implements IQueryHandler<GetGeneralSizeGuidesQuery, GeneralSizeGuidesResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: GetGeneralSizeGuidesQuery): Promise<GeneralSizeGuidesResult> {
    const guides = await this.sizeGuideManagementService.getGeneralSizeGuides(query.region);
    return { guides, meta: { region: query.region, count: guides.length } };
  }
}
