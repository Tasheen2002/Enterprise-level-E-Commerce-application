import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { VariantMediaManagementService, VariantMediaServiceQueryOptions, ProductVariantMediaSummary } from "../services/variant-media-management.service";

export interface GetProductVariantMediaQuery extends IQuery {
  readonly productId: string;
  readonly options?: VariantMediaServiceQueryOptions;
}

export class GetProductVariantMediaHandler implements IQueryHandler<GetProductVariantMediaQuery, ProductVariantMediaSummary> {
  constructor(private readonly variantMediaManagementService: VariantMediaManagementService) {}

  async handle(query: GetProductVariantMediaQuery): Promise<ProductVariantMediaSummary> {
    return this.variantMediaManagementService.getProductVariantMedia(query.productId, query.options);
  }
}
