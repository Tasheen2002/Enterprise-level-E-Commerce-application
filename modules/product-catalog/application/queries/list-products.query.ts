import { ProductManagementService } from "../services/product-management.service";
import { Product } from "../../domain/entities/product.entity";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

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

export interface ListProductsQuery extends IQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  brand?: string;
  status?: "draft" | "published" | "scheduled" | "archived";
  includeDrafts?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishAt";
  sortOrder?: "asc" | "desc";
}

export interface ListProductsResult {
  products: ProductResult[];
  totalCount: number;
  page: number;
  limit: number;
}

export class ListProductsHandler implements IQueryHandler<
  ListProductsQuery,
  QueryResult<ListProductsResult>
> {
  constructor(
    private readonly productManagementService: ProductManagementService,
  ) {}

  async handle(
    query: ListProductsQuery,
  ): Promise<QueryResult<ListProductsResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;

      // TODO: Implement actual list products logic in service
      const products = await this.productManagementService.getAllProducts({
        page,
        limit,
        categoryId: query.categoryId,
        brand: query.brand,
        status: query.status,
        includeDrafts: query.includeDrafts,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const productResults: ProductResult[] = products.items.map(
        (product: Product) => ({
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
        }),
      );

      const result: ListProductsResult = {
        products: productResults,
        totalCount: products.totalCount,
        page,
        limit,
      };

      return QueryResult.success<ListProductsResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<ListProductsResult>(
          "Failed to retrieve products",
        );
      }

      return QueryResult.failure<ListProductsResult>(
        "An unexpected error occurred while retrieving products",
      );
    }
  }
}
