import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { BackorderManagementService } from "../services/backorder-management.service";

export interface GetBackorderQuery extends IQuery {
  orderItemId: string;
}

export interface BackorderResult {
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
  hasPromisedEta: boolean;
  isCustomerNotified: boolean;
}

export class GetBackorderHandler implements IQueryHandler<
  GetBackorderQuery,
  QueryResult<BackorderResult>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    query: GetBackorderQuery,
  ): Promise<QueryResult<BackorderResult>> {
    try {
      // Validate orderItemId
      if (!query.orderItemId || query.orderItemId.trim().length === 0) {
        return QueryResult.failure<BackorderResult>(
          "Order item ID is required",
        );
      }

      // Get backorder
      const backorder = await this.backorderService.getBackorderByOrderItemId(
        query.orderItemId,
      );

      if (!backorder) {
        return QueryResult.failure<BackorderResult>("Backorder not found");
      }

      const result: BackorderResult = {
        orderItemId: backorder.getOrderItemId(),
        promisedEta: backorder.getPromisedEta(),
        notifiedAt: backorder.getNotifiedAt(),
        hasPromisedEta: backorder.hasPromisedEta(),
        isCustomerNotified: backorder.isCustomerNotified(),
      };

      return QueryResult.success<BackorderResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<BackorderResult>(
          `Failed to retrieve backorder: ${error.message}`,
        );
      }

      return QueryResult.failure<BackorderResult>(
        "An unexpected error occurred while retrieving backorder",
      );
    }
  }
}
