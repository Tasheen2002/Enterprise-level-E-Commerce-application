import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";
import { PreorderManagementService } from "../services/preorder-management.service";

export interface GetPreorderQuery extends IQuery {
  orderItemId: string;
}

export interface PreorderResult {
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
  hasReleaseDate: boolean;
  isCustomerNotified: boolean;
  isReleased: boolean;
}

export class GetPreorderHandler implements IQueryHandler<
  GetPreorderQuery,
  QueryResult<PreorderResult>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(
    query: GetPreorderQuery,
  ): Promise<QueryResult<PreorderResult>> {
    try {
      // Validate orderItemId
      if (!query.orderItemId || query.orderItemId.trim().length === 0) {
        return QueryResult.failure<PreorderResult>(
          "Order item ID is required",
        );
      }

      // Get preorder
      const preorder = await this.preorderService.getPreorderByOrderItemId(
        query.orderItemId,
      );

      if (!preorder) {
        return QueryResult.failure<PreorderResult>("Preorder not found");
      }

      const result: PreorderResult = {
        orderItemId: preorder.getOrderItemId(),
        releaseDate: preorder.getReleaseDate(),
        notifiedAt: preorder.getNotifiedAt(),
        hasReleaseDate: preorder.hasReleaseDate(),
        isCustomerNotified: preorder.isCustomerNotified(),
        isReleased: preorder.isReleased(),
      };

      return QueryResult.success<PreorderResult>(result);
    } catch (error) {
      if (error instanceof Error) {
        return QueryResult.failure<PreorderResult>(
          `Failed to retrieve preorder: ${error.message}`,
        );
      }

      return QueryResult.failure<PreorderResult>(
        "An unexpected error occurred while retrieving preorder",
      );
    }
  }
}
