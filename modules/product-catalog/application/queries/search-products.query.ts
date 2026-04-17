import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { ProductDTO } from "../../domain/entities/product.entity";
import { ProductSearchService } from "../services/product-search.service";

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

export interface SearchProductsResult {
  readonly items: ProductDTO[];
  readonly totalCount: number;
  readonly page: number;
  readonly limit: number;
  readonly searchTerm: string;
  readonly suggestions?: string[];
}

export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery, SearchProductsResult> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(input: SearchProductsQuery): Promise<SearchProductsResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const result = await this.productSearchService.searchProducts(input.searchTerm.trim(), {
      page,
      limit,
      category: input.categoryId,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      brand: input.brand,
      tags: input.tags,
      status: input.status,
      sortBy: input.sortBy ?? "relevance",
      sortOrder: input.sortOrder ?? "desc",
    });
    return { ...result, searchTerm: input.searchTerm, page, limit };
  }
}
