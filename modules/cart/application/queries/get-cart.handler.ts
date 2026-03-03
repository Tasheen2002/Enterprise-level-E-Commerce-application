import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { GetCartQuery } from "./get-cart.query";

export class GetCartHandler
  implements IQueryHandler<GetCartQuery, QueryResult<CartDto | null>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartQuery): Promise<QueryResult<CartDto | null>> {
    try {
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
