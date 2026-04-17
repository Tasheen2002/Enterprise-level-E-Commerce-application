import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetCartQuery extends IQuery {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCartHandler implements IQueryHandler<GetCartQuery, CartDto | null> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartQuery): Promise<CartDto | null> {
    return this.cartManagementService.getCart(
      query.cartId,
      query.userId,
      query.guestToken,
    );
  }
}
