import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/value-objects";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetAvailableSizeGuideRegionsQuery extends IQuery {}

export class GetAvailableSizeGuideRegionsHandler implements IQueryHandler<GetAvailableSizeGuideRegionsQuery, Region[]> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(_query: GetAvailableSizeGuideRegionsQuery): Promise<Region[]> {
    return this.sizeGuideManagementService.getAvailableRegions();
  }
}
