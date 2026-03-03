import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CartManagementService, CartSummaryDto } from "../services/cart-management.service";
import { GetCartSummaryQuery } from "./get-cart-summary.query";

export class GetCartSummaryHandler
  implements IQueryHandler<GetCartSummaryQuery, QueryResult<CartSummaryDto>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartSummaryQuery): Promise<QueryResult<CartSummaryDto>> {
    try {
      const cart = await this.cartManagementService.getCart(
        query.cartId,
        query.userId,
        query.guestToken,
      );
      if (!cart) {
        return QueryResult.failure<CartSummaryDto>("Cart not found");
      }
      return QueryResult.success<CartSummaryDto>(cart.summary);
    } catch (error) {
      return QueryResult.failure<CartSummaryDto>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
