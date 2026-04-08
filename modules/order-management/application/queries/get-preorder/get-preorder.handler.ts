import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetPreorderQuery, PreorderResult } from "./get-preorder.query";
import { PreorderManagementService } from "../../services/preorder-management.service";

export class GetPreorderHandler implements IQueryHandler<
  GetPreorderQuery,
  QueryResult<PreorderResult>
> {
  constructor(private readonly preorderService: PreorderManagementService) {}

  async handle(query: GetPreorderQuery): Promise<QueryResult<PreorderResult>> {
    try {
      // Get preorder (service throws if not found)
      const preorder = await this.preorderService.getPreorderByOrderItemId(
        query.orderItemId,
      );

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
