import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";
import { CartNotFoundError } from "../../domain/errors";

export interface GetActiveCartByUserQuery extends IQuery {
  readonly userId: string;
}

export class GetActiveCartByUserHandler implements IQueryHandler<GetActiveCartByUserQuery, CartDto> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByUserQuery): Promise<CartDto> {
    const cart = await this.cartManagementService.getActiveCartByUser(query.userId);
    if (cart === null) throw new CartNotFoundError(`active cart for user ${query.userId}`);
    return cart;
  }
}
