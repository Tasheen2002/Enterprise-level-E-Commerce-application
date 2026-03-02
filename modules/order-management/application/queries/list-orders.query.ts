import { QueryResult } from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

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

export class ListOrdersQueryHandler {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    query: ListOrdersQuery,
  ): Promise<QueryResult<PaginatedOrdersResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;

      // Validate pagination
      if (page < 1) {
        return QueryResult.failure<PaginatedOrdersResult>(
          "Page must be greater than 0",
        );
      }

      if (limit < 1 || limit > 100) {
        return QueryResult.failure<PaginatedOrdersResult>(
          "Limit must be between 1 and 100",
        );
      }

      // Execute service
      const result = await this.orderService.getAllOrders({
        page,
        limit,
        userId: query.userId,
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy || "createdAt",
        sortOrder: query.sortOrder || "desc",
      });

      const paginatedResult: PaginatedOrdersResult = {
        items: result.items,
        totalCount: result.totalCount,
        page,
        limit,
        totalPages: Math.ceil(result.totalCount / limit),
      };

      return QueryResult.success<PaginatedOrdersResult>(paginatedResult);
    } catch (error) {
      return QueryResult.failure<PaginatedOrdersResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
