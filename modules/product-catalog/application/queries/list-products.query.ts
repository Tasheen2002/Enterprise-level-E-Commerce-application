import { IQuery } from "@/api/src/shared/application";
import { ProductResult } from "./get-product.query";

export type { ProductResult };

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
