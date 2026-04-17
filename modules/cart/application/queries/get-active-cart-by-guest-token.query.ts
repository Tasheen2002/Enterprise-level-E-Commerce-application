import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetActiveCartByGuestTokenQuery extends IQuery {
  readonly guestToken: string;
}

export class GetActiveCartByGuestTokenHandler implements IQueryHandler<GetActiveCartByGuestTokenQuery, CartDto | null> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByGuestTokenQuery): Promise<CartDto | null> {
    return this.cartManagementService.getActiveCartByGuestToken(query.guestToken);
  }
}
