import {
  CartManagementService,
  CartDto,
} from "../services/cart-management.service";
import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from "@/api/src/shared/application";

export interface GetActiveCartByUserQuery extends IQuery {
  userId: string;
}

export class GetActiveCartByUserHandler implements IQueryHandler<
  GetActiveCartByUserQuery,
  QueryResult<CartDto | null>
> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(
    query: GetActiveCartByUserQuery,
  ): Promise<QueryResult<CartDto | null>> {
    try {
      if (!query.userId) {
        return QueryResult.failure<CartDto | null>("userId: User ID is required");
      }

      const cart = await this.cartManagementService.getActiveCartByUser(
        query.userId,
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
