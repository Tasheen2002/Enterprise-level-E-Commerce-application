import { QueryResult } from "@/api/src/shared/application";
import { ListOrdersQuery, PaginatedOrdersResult } from "./list-orders.query";
import { OrderManagementService } from "../services/order-management.service";

export class ListOrdersQueryHandler {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    query: ListOrdersQuery,
  ): Promise<QueryResult<PaginatedOrdersResult>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;

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
