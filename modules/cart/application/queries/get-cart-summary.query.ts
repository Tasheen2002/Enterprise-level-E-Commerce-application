import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CartManagementService, CartSummaryDto } from "../services/cart-management.service";
import { CartNotFoundError } from "../../domain/errors";

export interface GetCartSummaryQuery extends IQuery {
  readonly cartId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCartSummaryHandler implements IQueryHandler<GetCartSummaryQuery, CartSummaryDto> {
  constructor(private readonly cartManagementService: CartManagementService) {}

  async handle(query: GetCartSummaryQuery): Promise<CartSummaryDto> {
    const summary = await this.cartManagementService.getCartSummary(
      query.cartId,
      query.userId,
      query.guestToken,
    );
    if (summary === null) throw new CartNotFoundError(query.cartId);
    return summary;
  }
}
