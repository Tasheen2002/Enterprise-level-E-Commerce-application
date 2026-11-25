import { IProductRepository } from "../../domain/repositories/product.repository";
import { ProductId } from "../../domain/value-objects/product-id.vo";
import { ProductNotFoundError } from "../../domain/errors/product-catalog.errors";
import { isProductLive } from "../../domain/policies/storefront-visibility";

/**
 * Guards product sub-resources (variants, media) on public routes: a product
 * that is not live is reported as not found to shoppers, so drafts and
 * upcoming launches are not revealed through their details.
 */
export class ProductVisibilityPolicy {
  constructor(private readonly productRepository: IProductRepository) {}

  async assertVisible(productId: string, includeUnpublished: boolean): Promise<void> {
    if (includeUnpublished) return;
    const product = await this.productRepository.findById(ProductId.fromString(productId));
    if (!product || !isProductLive(product.status, product.publishAt)) {
      throw new ProductNotFoundError(productId);
    }
  }

  /** Keeps only the ids of live products (order preserved) unless staff. */
  async filterVisible(productIds: string[], includeUnpublished: boolean): Promise<string[]> {
    if (includeUnpublished || productIds.length === 0) return productIds;
    const products = await this.productRepository.findByIds(
      productIds.map((id) => ProductId.fromString(id)),
    );
    const live = new Set(
      products
        .filter((product) => isProductLive(product.status, product.publishAt))
        .map((product) => product.id.getValue()),
    );
    return productIds.filter((id) => live.has(id));
  }
}
