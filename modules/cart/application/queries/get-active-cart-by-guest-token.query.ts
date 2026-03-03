import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetActiveCartByGuestTokenQuery extends IQuery {
  guestToken: string;
}

export class GetActiveCartByGuestTokenHandler implements IQueryHandler<
  GetActiveCartByGuestTokenQuery,
  QueryResult<CartDto | null>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    query: GetActiveCartByGuestTokenQuery,
  ): Promise<QueryResult<CartDto | null>> {
    try {
      if (!query.guestToken) {
        return QueryResult.failure<CartDto | null>("guestToken: Guest token is required");
      }

      const cart = await this.cartManagementService.getActiveCartByGuestToken(
        query.guestToken,
      );

      if (!cart) {
        return QueryResult.success<CartDto | null>(null);
      }

      return QueryResult.success<CartDto>(cart);
    } catch (error) {
      return QueryResult.failure<CartDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
