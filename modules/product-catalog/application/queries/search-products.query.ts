import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductSearchService, ProductSearchResult } from "../services/product-search.service";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_LIMIT, MIN_PAGE } from "../../domain/constants/pagination.constants";

export interface SearchProductsQuery extends IQuery {
  readonly searchTerm: string;
  readonly page?: number;
  readonly limit?: number;
  readonly categoryId?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly brand?: string;
  readonly tags?: string[];
  readonly status?: "draft" | "published" | "scheduled" | "archived";
  readonly sortBy?: "relevance" | "price" | "title" | "createdAt" | "publishAt";
  readonly sortOrder?: "asc" | "desc";
}

export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery, ProductSearchResult> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(query: SearchProductsQuery): Promise<ProductSearchResult> {
    return this.productSearchService.searchProducts(query.searchTerm.trim(), {
      page: Math.max(MIN_PAGE, query.page ?? MIN_PAGE),
      limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_LIMIT, query.limit ?? DEFAULT_PAGE_SIZE)),
      category: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      brand: query.brand,
      tags: query.tags,
      status: query.status,
      sortBy: query.sortBy ?? "relevance",
      sortOrder: query.sortOrder ?? "desc",
    });
  }
}
