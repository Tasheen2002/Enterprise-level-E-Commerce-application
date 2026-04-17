import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartDto } from "../services/cart-management.service";

export interface GetActiveCartByUserQuery extends IQuery {
  readonly userId: string;
}

export class GetActiveCartByUserHandler implements IQueryHandler<GetActiveCartByUserQuery, CartDto | null> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetActiveCartByUserQuery): Promise<CartDto | null> {
    return this.cartManagementService.getActiveCartByUser(query.userId);
  }
}
