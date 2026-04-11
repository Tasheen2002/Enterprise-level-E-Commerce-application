import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartSummaryDto } from "../services/cart-management.service";

export interface GetCartSummaryQuery extends IQuery {
  cartId: string;
  userId?: string;
  guestToken?: string;
}

export class GetCartSummaryHandler implements IQueryHandler<GetCartSummaryQuery, QueryResult<CartSummaryDto | null>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartSummaryQuery): Promise<QueryResult<CartSummaryDto | null>> {
    const cart = await this.cartManagementService.getCart(
      query.cartId,
      query.userId,
      query.guestToken,
    );
    return QueryResult.success<CartSummaryDto | null>(cart ? cart.summary : null);
  }
}
