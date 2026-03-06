import { IQuery } from "@/api/src/shared/application";

export interface ListCategoriesQuery extends IQuery {
  page?: number;
  limit?: number;
  parentId?: string;
  includeChildren?: boolean;
  sortBy?: "name" | "position" | "createdAt";
  sortOrder?: "asc" | "desc";
}
