import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { ProductManagementService } from "../services/product-management.service";
import { GetProductQuery, ProductResult } from "./get-product.query";

export class GetProductHandler implements IQueryHandler<GetProductQuery, QueryResult<ProductResult>> {
  constructor(private readonly productManagementService: ProductManagementService) {}

  async handle(query: GetProductQuery): Promise<QueryResult<ProductResult>> {
    try {
      let product;
      if (query.productId) {
        product = await this.productManagementService.getProductById(query.productId);
      } else if (query.slug) {
        product = await this.productManagementService.getProductBySlug(query.slug);
      }

      if (!product) {
        return QueryResult.failure<ProductResult>("Product not found");
      }

      const result: ProductResult = {
        productId: product.getId().toString(),
        title: product.getTitle(),
        slug: product.getSlug().toString(),
        brand: product.getBrand() ?? undefined,
        shortDesc: product.getShortDesc() ?? undefined,
        longDescHtml: product.getLongDescHtml() ?? undefined,
        status: product.getStatus(),
        publishAt: product.getPublishAt() ?? undefined,
        countryOfOrigin: product.getCountryOfOrigin() ?? undefined,
        seoTitle: product.getSeoTitle() ?? undefined,
        seoDescription: product.getSeoDescription() ?? undefined,
        price: product.getPrice().getValue(),
        priceSgd: product.getPriceSgd()?.getValue() ?? null,
        priceUsd: product.getPriceUsd()?.getValue() ?? null,
        compareAtPrice: product.getCompareAtPrice()?.getValue() ?? null,
        createdAt: product.getCreatedAt(),
        updatedAt: product.getUpdatedAt(),
      };

      return QueryResult.success<ProductResult>(result);
    } catch (error) {
      return QueryResult.failure<ProductResult>(
        error instanceof Error ? `Failed to retrieve product: ${error.message}` : "Failed to retrieve product",
      );
    }
  }
}
