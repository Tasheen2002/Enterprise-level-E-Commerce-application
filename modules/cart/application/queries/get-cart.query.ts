import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { CartNotFoundError } from "../../domain/errors";

export interface GetCartQuery extends IQuery {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCartHandler implements IQueryHandler<GetCartQuery, CartDto> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartQuery): Promise<CartDto> {
    const cart = await this.cartManagementService.getCart(
      query.cartId,
      query.userId,
      query.guestToken,
    );
    if (cart === null) throw new CartNotFoundError(query.cartId);
    return cart;
  }
}
