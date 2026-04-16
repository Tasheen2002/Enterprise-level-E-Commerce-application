import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CheckoutOrderService, OrderResult } from "../services/checkout-order.service";

export interface GetOrderByCheckoutQuery extends IQuery {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetOrderByCheckoutHandler implements IQueryHandler<GetOrderByCheckoutQuery, QueryResult<OrderResult>> {
  constructor(private readonly checkoutOrderService: CheckoutOrderService) {}

  async handle(query: GetOrderByCheckoutQuery): Promise<QueryResult<OrderResult>> {
    const order = await this.checkoutOrderService.getOrderByCheckoutId(
      query.checkoutId,
      query.userId,
      query.guestToken,
    );
    return QueryResult.success<OrderResult>(order!);
  }
}
