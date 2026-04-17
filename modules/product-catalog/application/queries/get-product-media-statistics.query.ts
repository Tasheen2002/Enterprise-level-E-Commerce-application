import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface GetProductMediaStatisticsQuery extends IQuery {
  readonly productId: string;
}

export interface ProductMediaStatisticsResult {
  readonly totalMedia: number;
  readonly hasCoverImage: boolean;
  readonly imageCount: number;
  readonly videoCount: number;
  readonly otherCount: number;
  readonly totalSize: number;
  readonly averageFileSize: number;
}

export class GetProductMediaStatisticsHandler implements IQueryHandler<GetProductMediaStatisticsQuery, ProductMediaStatisticsResult> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: GetProductMediaStatisticsQuery): Promise<ProductMediaStatisticsResult> {
    return this.productMediaManagementService.getProductMediaStatistics(query.productId);
  }
}
