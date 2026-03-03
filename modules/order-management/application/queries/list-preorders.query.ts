import { IQuery } from "@/api/src/shared/application";

export interface ListPreordersQuery extends IQuery {
  limit?: number;
  offset?: number;
  sortBy?: "releaseDate" | "notifiedAt";
  sortOrder?: "asc" | "desc";
  filterType?: "all" | "notified" | "unnotified" | "released";
}

export interface PreorderResult {
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
  hasReleaseDate: boolean;
  isCustomerNotified: boolean;
  isReleased: boolean;
}

export interface ListPreordersResult {
  items: PreorderResult[];
  total: number;
  limit: number;
  offset: number;
}
