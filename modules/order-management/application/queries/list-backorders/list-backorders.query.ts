import { IQuery } from "@/api/src/shared/application";

export interface ListBackordersQuery extends IQuery {
  limit?: number;
  offset?: number;
  sortBy?: "promisedEta" | "notifiedAt";
  sortOrder?: "asc" | "desc";
  filterType?: "all" | "notified" | "unnotified" | "overdue";
}

export interface BackorderResult {
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
  hasPromisedEta: boolean;
  isCustomerNotified: boolean;
}

export interface ListBackordersResult {
  items: BackorderResult[];
  total: number;
  limit: number;
  offset: number;
}
