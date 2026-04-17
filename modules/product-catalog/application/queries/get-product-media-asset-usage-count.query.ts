import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface GetProductMediaAssetUsageCountQuery extends IQuery {
  readonly assetId: string;
}

export interface ProductMediaAssetUsageCountResult {
  readonly assetId: string;
  readonly usageCount: number;
}

export class GetProductMediaAssetUsageCountHandler implements IQueryHandler<GetProductMediaAssetUsageCountQuery, ProductMediaAssetUsageCountResult> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: GetProductMediaAssetUsageCountQuery): Promise<ProductMediaAssetUsageCountResult> {
    const usageCount = await this.productMediaManagementService.getAssetUsageCount(query.assetId);
    return { assetId: query.assetId, usageCount };
  }
}
