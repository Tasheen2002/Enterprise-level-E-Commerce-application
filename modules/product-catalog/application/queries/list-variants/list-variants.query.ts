import { IQuery } from "@/api/src/shared/application";

export interface ListVariantsQuery extends IQuery {
  productId: string;
  page?: number;
  limit?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  sortBy?: "sku" | "createdAt" | "size" | "color";
  sortOrder?: "asc" | "desc";
}
