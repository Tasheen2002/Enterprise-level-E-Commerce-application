import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface GetVariantMediaAssetUsageCountQuery extends IQuery {
  assetId: string;
}

export interface VariantMediaAssetUsageCountResult {
  assetId: string;
  usageCount: number;
}

export class GetVariantMediaAssetUsageCountHandler implements IQueryHandler<GetVariantMediaAssetUsageCountQuery, VariantMediaAssetUsageCountResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetVariantMediaAssetUsageCountQuery): Promise<VariantMediaAssetUsageCountResult> {
    const usageCount = await this.variantMediaManagementService.getAssetUsageCount(query.assetId);
    return { assetId: query.assetId, usageCount };
  }
}
