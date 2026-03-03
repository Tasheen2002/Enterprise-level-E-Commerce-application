import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { Product } from "../../domain/entities/product.entity";
import { ProductSearchService } from "../services/product-search.service";
import { SearchProductsQuery, SearchProductsResult, ProductResult } from "./search-products.query";

export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery, QueryResult<SearchProductsResult>> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: SearchProductsQuery): Promise<QueryResult<SearchProductsResult>> {
    try {
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

      const productResults: ProductResult[] = searchResults.items.map((product: Product) => ({
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
      }));

      return QueryResult.success<SearchProductsResult>({
        products: productResults,
        totalCount: searchResults.totalCount,
        page,
        limit,
        searchTerm: query.searchTerm,
        suggestions: searchResults.suggestions,
      });
    } catch (error) {
      return QueryResult.failure<SearchProductsResult>("Failed to search products");
    }
  }
}
