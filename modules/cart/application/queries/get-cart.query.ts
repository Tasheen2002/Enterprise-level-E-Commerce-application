import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetCartQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}

export class GetCartHandler implements IQueryHandler<GetCartQuery, QueryResult<CartDto | null>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartQuery): Promise<QueryResult<CartDto | null>> {
    const cart = await this.cartManagementService.getCart(
      query.cartId,
      query.userId,
      query.guestToken,
    );
    return QueryResult.success<CartDto | null>(cart);
  }
}
