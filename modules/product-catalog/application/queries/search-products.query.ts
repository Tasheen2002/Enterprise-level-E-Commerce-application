import { IQuery, IQueryHandler } from "@/api/src/shared/application";
import { ProductSearchService } from "../services/product-search.service";

export interface SearchProductsInput extends IQuery {
  searchTerm: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  tags?: string[];
  status?: "draft" | "published" | "scheduled" | "archived";
  sortBy?: "relevance" | "price" | "title" | "createdAt" | "publishAt";
  sortOrder?: "asc" | "desc";
}

export interface SearchProductsResult {
  items: ReturnType<typeof Array.prototype.map>;
  totalCount: number;
  page: number;
  limit: number;
  searchTerm: string;
  suggestions?: string[];
}

export class SearchProductsHandler implements IQueryHandler<SearchProductsInput, any> {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async handle(input: SearchProductsInput): Promise<any> {
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
