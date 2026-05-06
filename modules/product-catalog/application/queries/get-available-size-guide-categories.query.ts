import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { Region } from "../../domain/value-objects";
import { SizeGuideManagementService } from "../services/size-guide-management.service";

export interface GetAvailableSizeGuideCategoriesQuery extends IQuery {
  readonly region?: Region;
}

export interface AvailableSizeGuideCategoriesResult {
  readonly categories: string[];
  readonly meta: { region: string };
}

export class GetAvailableSizeGuideCategoriesHandler implements IQueryHandler<GetAvailableSizeGuideCategoriesQuery, AvailableSizeGuideCategoriesResult> {
  constructor(private readonly sizeGuideManagementService: SizeGuideManagementService) {}

  async handle(query: GetAvailableSizeGuideCategoriesQuery): Promise<AvailableSizeGuideCategoriesResult> {
    const categories = await this.sizeGuideManagementService.getAvailableCategories(query.region);
    return { categories, meta: { region: query.region ?? "all" } };
  }
}
