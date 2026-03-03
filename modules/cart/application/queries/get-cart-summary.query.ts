import {
  CartManagementService,
  CartSummaryDto,
} from "../services/cart-management.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetCartSummaryQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}

export class GetCartSummaryHandler implements IQueryHandler<
  GetCartSummaryQuery,
  QueryResult<CartSummaryDto>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    query: GetCartSummaryQuery,
  ): Promise<QueryResult<CartSummaryDto>> {
    try {
      if (!query.cartId) {
        return QueryResult.failure<CartSummaryDto>("cartId: Cart ID is required");
      }

      if (query.userId && query.guestToken) {
        return QueryResult.failure<CartSummaryDto>(
          "Only one of userId or guestToken should be provided",
        );
      }

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
