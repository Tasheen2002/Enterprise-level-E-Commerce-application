import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService, ProductMediaServiceQueryOptions, ProductMediaSummary } from "../services/product-media-management.service";

export interface GetProductMediaQuery extends IQuery {
  productId: string;
  options?: ProductMediaServiceQueryOptions;
}

export class GetProductMediaHandler implements IQueryHandler<GetProductMediaQuery, ProductMediaSummary> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: GetProductMediaQuery): Promise<ProductMediaSummary> {
    return await this.productMediaManagementService.getProductMedia(query.productId, query.options);
  }
}
