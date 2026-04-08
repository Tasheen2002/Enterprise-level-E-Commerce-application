import { Order } from "../../../domain/entities/order.entity";

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "createdAt" | "updatedAt" | "orderNumber";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedOrdersResult {
  items: Order[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
