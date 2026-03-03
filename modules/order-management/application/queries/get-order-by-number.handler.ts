import { QueryResult } from "@/api/src/shared/application";
import { GetOrderByNumberQuery } from "./get-order-by-number.query";
import { OrderManagementService } from "../services/order-management.service";
import { Order } from "../../domain/entities/order.entity";

export class GetOrderByNumberQueryHandler {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(query: GetOrderByNumberQuery): Promise<QueryResult<Order>> {
    try {
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
