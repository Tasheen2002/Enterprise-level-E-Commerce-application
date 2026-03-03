import { ProductManagementService } from "../services/product-management.service";
import { Product } from "../../domain/entities/product.entity";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetProductQuery extends IQuery {
  productId?: string;
  slug?: string;
}

export interface ProductResult {
  productId: string;
  title: string;
  slug: string;
  brand?: string;
  shortDesc?: string;
  longDescHtml?: string;
  status: string;
  publishAt?: Date;
  countryOfOrigin?: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number;
  priceSgd?: number | null;
  priceUsd?: number | null;
  compareAtPrice?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetProductHandler implements IQueryHandler<
  GetProductQuery,
  QueryResult<ProductResult>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(query: GetProductQuery): Promise<QueryResult<ProductResult>> {
    try {
      // Validate that either productId or slug is provided
      if (!query.productId && !query.slug) {
        return QueryResult.failure<ProductResult>(
          "Either productId or slug is required",
        );
      }

      // Get product by ID or slug
      let product;
      if (query.productId) {
        product = await this.productManagementService.getProductById(
          query.productId,
        );
      } else if (query.slug) {
        product = await this.productManagementService.getProductBySlug(
          query.slug,
        );
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
      if (error instanceof Error) {
        return QueryResult.failure<ProductResult>(
          `Failed to retrieve product: ${error.message}`,
        );
      }

      return QueryResult.failure<ProductResult>(
        "An unexpected error occurred while retrieving product",
      );
    }
  }
}
