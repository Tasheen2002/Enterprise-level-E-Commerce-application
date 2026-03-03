import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { GetActiveCartByGuestTokenQuery } from "./get-active-cart-by-guest-token.query";

export class GetActiveCartByGuestTokenHandler
  implements IQueryHandler<GetActiveCartByGuestTokenQuery, QueryResult<CartDto | null>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByGuestTokenQuery): Promise<QueryResult<CartDto | null>> {
    try {
      const cart = await this.cartManagementService.getActiveCartByGuestToken(query.guestToken);
      return QueryResult.success<CartDto | null>(cart);
    } catch (error) {
      return QueryResult.failure<CartDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
