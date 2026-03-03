import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { OrderManagementService } from "../services/order-management.service";

export interface StatusHistoryResult {
  historyId: number;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  changedAt: Date;
  changedBy?: string;
  isInitialStatus: boolean;
}

export interface GetOrderStatusHistoryQuery extends IQuery {
  orderId: string;
  limit?: number;
  offset?: number;
}

export class GetOrderStatusHistoryHandler implements IQueryHandler<
  GetOrderStatusHistoryQuery,
  QueryResult<StatusHistoryResult[]>
> {
  constructor(private readonly orderService: OrderManagementService) {}

  async handle(
    query: GetOrderStatusHistoryQuery,
  ): Promise<QueryResult<StatusHistoryResult[]>> {
    try {
      if (!query.orderId || query.orderId.trim().length === 0) {
        return QueryResult.failure("Order ID is required");
      }

      const histories = await this.orderService.getOrderStatusHistory(
        query.orderId,
        {
          limit: query.limit,
          offset: query.offset,
        },
      );

      // Convert entities to plain objects
      const results: StatusHistoryResult[] = histories.map((history) => ({
        historyId: history.getHistoryId(),
        orderId: history.getOrderId(),
        fromStatus: history.getFromStatus()?.getValue(),
        toStatus: history.getToStatus().getValue(),
        changedAt: history.getChangedAt(),
        changedBy: history.getChangedBy(),
        isInitialStatus: history.isInitialStatus(),
      }));

      return QueryResult.success(results);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
