import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductTagManagementService } from "../services/product-tag-management.service";

export interface GetProductTagStatsQuery extends IQuery {}

export interface ProductTagStatsResult {
  readonly totalTags: number;
  readonly tagsByKind: Array<{ kind: string | null; count: number }>;
  readonly averageTagLength: number;
}

export class GetProductTagStatsHandler implements IQueryHandler<GetProductTagStatsQuery, ProductTagStatsResult> {
  constructor(private readonly productTagManagementService: ProductTagManagementService) {}

  async handle(_query: GetProductTagStatsQuery): Promise<ProductTagStatsResult> {
    return this.productTagManagementService.getTagStats();
  }
}
