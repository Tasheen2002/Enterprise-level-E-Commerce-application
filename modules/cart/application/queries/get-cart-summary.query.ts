import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartSummaryDto } from "../services/cart-management.service";

export interface GetCartSummaryQuery extends IQuery {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCartSummaryHandler implements IQueryHandler<GetCartSummaryQuery, CartSummaryDto | null> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartSummaryQuery): Promise<CartSummaryDto | null> {
    const cart = await this.cartManagementService.getCart(
      query.cartId,
      query.userId,
      query.guestToken,
    );
    return cart ? cart.summary : null;
  }
}
