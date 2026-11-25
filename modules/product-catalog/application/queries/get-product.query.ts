import { isProductLive } from "../../domain/policies/storefront-visibility";
import { ProductNotFoundError } from "../../domain/errors/product-catalog.errors";
import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductManagementService } from "../services/product-management.service";
import { MissingProductIdentifierError } from "../../domain/errors/product-catalog.errors";

export interface GetProductQuery extends IQuery {
  readonly productId?: string;
  readonly slug?: string;
  /** Staff only: also return drafts, future launches and archived products. */
  readonly includeUnpublished?: boolean;
}

export class GetProductHandler implements IQueryHandler<GetProductQuery, ProductDTO> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(query: GetProductQuery): Promise<ProductDTO> {
    const identifier = query.productId ?? query.slug;
    if (!identifier) throw new MissingProductIdentifierError();
    const product = query.productId
      ? await this.productManagementService.getProductById(query.productId)
      : await this.productManagementService.getProductBySlug(identifier);
    // Shoppers get "not found" for products that are not live, so drafts and
    // upcoming launches are not revealed.
    if (!query.includeUnpublished && !isProductLive(product.status, product.publishAt)) {
      throw new ProductNotFoundError(identifier);
    }
    return product;
  }
}
