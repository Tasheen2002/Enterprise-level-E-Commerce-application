import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { GetActiveCartByUserQuery } from "./get-active-cart-by-user.query";

export class GetActiveCartByUserHandler
  implements IQueryHandler<GetActiveCartByUserQuery, QueryResult<CartDto | null>>
{
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByUserQuery): Promise<QueryResult<CartDto | null>> {
    try {
      const cart = await this.cartManagementService.getActiveCartByUser(query.userId);
      return QueryResult.success<CartDto | null>(cart);
    } catch (error) {
      return QueryResult.failure<CartDto | null>(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
