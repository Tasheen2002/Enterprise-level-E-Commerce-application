import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface GetProductMediaStatisticsQuery extends IQuery {
  productId: string;
}

export interface ProductMediaStatisticsResult {
  totalMedia: number;
  hasCoverImage: boolean;
  imageCount: number;
  videoCount: number;
  otherCount: number;
  totalSize: number;
  averageFileSize: number;
}

export class GetProductMediaStatisticsHandler implements IQueryHandler<GetProductMediaStatisticsQuery, ProductMediaStatisticsResult> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: GetProductMediaStatisticsQuery): Promise<ProductMediaStatisticsResult> {
    return await this.productMediaManagementService.getProductMediaStatistics(query.productId);
  }
}
