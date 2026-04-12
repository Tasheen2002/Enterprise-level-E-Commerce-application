import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetProductTagStatsQuery extends IQuery {}

export interface ProductTagStatsResult {
  totalTags: number;
  tagsByKind: Array<{ kind: string | null; count: number }>;
  averageTagLength: number;
}

export class GetProductTagStatsHandler implements IQueryHandler<GetProductTagStatsQuery, ProductTagStatsResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(_query: GetProductTagStatsQuery): Promise<ProductTagStatsResult> {
    return await this.productTagManagementService.getTagStats();
  }
}
