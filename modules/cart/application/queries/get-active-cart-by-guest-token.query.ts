import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { CartNotFoundError } from "../../domain/errors";

export interface GetActiveCartByGuestTokenQuery extends IQuery {
  readonly guestToken: string;
}

export class GetActiveCartByGuestTokenHandler implements IQueryHandler<GetActiveCartByGuestTokenQuery, CartDto> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByGuestTokenQuery): Promise<CartDto> {
    const cart = await this.cartManagementService.getActiveCartByGuestToken(query.guestToken);
    if (cart === null) throw new CartNotFoundError(`active cart for guest token`);
    return cart;
  }
}
