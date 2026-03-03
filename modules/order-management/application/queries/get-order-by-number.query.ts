import { QueryResult } from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export interface GetOrderByNumberQuery {
  orderNumber: string;
}

export class GetOrderByNumberQueryHandler {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetOrderByNumberQuery): Promise<QueryResult<Order>> {
    try {
      // Validation
      if (!query.orderNumber || query.orderNumber.trim().length === 0) {
        return QueryResult.failure<Order>("Order number is required");
      }

      // Execute service
      const order = await this.orderService.getOrderByOrderNumber(
        query.orderNumber,
      );

      if (!order) {
        return QueryResult.failure<Order>("Order not found");
      }

      return QueryResult.success<Order>(order);
    } catch (error) {
      return QueryResult.failure<Order>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
