import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetActiveCartByGuestTokenQuery extends IQuery {
  guestToken: string;
}

export class GetActiveCartByGuestTokenHandler implements IQueryHandler<GetActiveCartByGuestTokenQuery, QueryResult<CartDto | null>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByGuestTokenQuery): Promise<QueryResult<CartDto | null>> {
    const cart = await this.cartManagementService.getActiveCartByGuestToken(query.guestToken);
    return QueryResult.success<CartDto | null>(cart);
  }
}
