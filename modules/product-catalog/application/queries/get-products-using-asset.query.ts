import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductMediaManagementService } from "../services/product-media-management.service";

export interface GetProductsUsingAssetQuery extends IQuery {
  assetId: string;
}

export class GetProductsUsingAssetHandler implements IQueryHandler<GetProductsUsingAssetQuery, string[]> {
  constructor(private readonly productMediaManagementService: ProductMediaManagementService) {}

  async handle(query: GetProductsUsingAssetQuery): Promise<string[]> {
    return await this.productMediaManagementService.getProductsUsingAsset(query.assetId);
  }
}
