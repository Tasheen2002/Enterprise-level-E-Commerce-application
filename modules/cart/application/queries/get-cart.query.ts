import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetCartQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}

export class GetCartHandler implements IQueryHandler<
  GetCartQuery,
  QueryResult<CartDto | null>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartQuery): Promise<QueryResult<CartDto | null>> {
    try {
      if (!query.cartId) {
        return QueryResult.failure<CartDto | null>("cartId: Cart ID is required");
      }

      if (query.userId && query.guestToken) {
        return QueryResult.failure<CartDto | null>(
          "Only one of userId or guestToken should be provided",
        );
      }

      const cart = await this.cartManagementService.getCart(
        query.cartId,
        query.userId,
        query.guestToken,
      );

      if (!cart) {
        return QueryResult.failure<CartDto | null>("Cart not found");
      }

      return QueryResult.success<CartDto>(cart);
    } catch (error) {
      return QueryResult.failure<CartDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
