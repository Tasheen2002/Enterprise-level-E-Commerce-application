import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetActiveCartByUserQuery extends IQuery {
  userId: string;
}

export class GetActiveCartByUserHandler implements IQueryHandler<GetActiveCartByUserQuery, QueryResult<CartDto | null>> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByUserQuery): Promise<QueryResult<CartDto | null>> {
    const cart = await this.cartManagementService.getActiveCartByUser(query.userId);
    return QueryResult.success<CartDto | null>(cart);
  }
}
