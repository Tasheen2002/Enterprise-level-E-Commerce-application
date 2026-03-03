import { ProductSearchService } from "../services/product-search.service";
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

export interface SearchProductsQuery extends IQuery {
  searchTerm: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  status?: "draft" | "published" | "scheduled" | "archived";
  sortBy?: "relevance" | "price" | "title" | "createdAt" | "publishAt";
  sortOrder?: "asc" | "desc";
}

export interface SearchProductsResult {
  products: ProductResult[];
  totalCount: number;
  page: number;
  limit: number;
  searchTerm: string;
  suggestions?: string[];
}

export class SearchProductsHandler implements IQueryHandler<
  SearchProductsQuery,
  QueryResult<SearchProductsResult>
> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(
    query: SearchProductsQuery,
  ): Promise<QueryResult<SearchProductsResult>> {
    try {
      if (!query.searchTerm || query.searchTerm.trim() === "") {
        return QueryResult.failure<SearchProductsResult>(
          "Search term is required",
        );
      }

      const page = query.page || 1;
      const limit = query.limit || 20;

      const searchResults = await this.productSearchService.searchProducts(
        query.searchTerm.trim(),
        {
          page,
          limit,
          category: query.categoryId,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          brand: query.brand,
          status: query.status,
          sortBy: query.sortBy || "relevance",
          sortOrder: query.sortOrder || "desc",
        },
      );

      const productResults: ProductResult[] = searchResults.items.map(
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

      const result: SearchProductsResult = {
        products: productResults,
        totalCount: searchResults.totalCount,
        page,
        limit,
        searchTerm: query.searchTerm,
        suggestions: searchResults.suggestions,
      };

      return QueryResult.success<SearchProductsResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<SearchProductsResult>(
          "Failed to search products",
        );
      }

      return QueryResult.failure<SearchProductsResult>(
        "An unexpected error occurred while searching products",
      );
    }
  }
}
