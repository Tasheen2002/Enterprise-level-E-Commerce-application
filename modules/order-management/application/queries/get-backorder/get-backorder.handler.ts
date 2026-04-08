import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetBackorderQuery, BackorderResult } from "./get-backorder.query";
import { BackorderManagementService } from "../../services/backorder-management.service";

export class GetBackorderHandler implements IQueryHandler<
  GetBackorderQuery,
  QueryResult<BackorderResult>
> {
  constructor(private readonly backorderService: BackorderManagementService) {}

  async handle(
    query: GetBackorderQuery,
  ): Promise<QueryResult<BackorderResult>> {
    try {
      // Get backorder (service throws if not found)
      const backorder = await this.backorderService.getBackorderByOrderItemId(
        query.orderItemId,
      );

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
