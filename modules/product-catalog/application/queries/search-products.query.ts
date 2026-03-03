import { IQuery } from "@/api/src/shared/application";
import { ProductResult } from "./get-product.query";

export type { ProductResult };

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
