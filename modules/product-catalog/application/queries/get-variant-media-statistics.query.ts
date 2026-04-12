import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService } from "../services/variant-media-management.service";

export interface GetVariantMediaStatisticsQuery extends IQuery {
  variantId: string;
}

export interface VariantMediaStatisticsResult {
  totalMedia: number;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  totalSize: number;
  averageFileSize: number;
}

export class GetVariantMediaStatisticsHandler implements IQueryHandler<GetVariantMediaStatisticsQuery, VariantMediaStatisticsResult> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetVariantMediaStatisticsQuery): Promise<VariantMediaStatisticsResult> {
    return await this.variantMediaManagementService.getVariantMediaStatistics(query.variantId);
  }
}
