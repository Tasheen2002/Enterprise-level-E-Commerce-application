import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CheckoutOrderService, OrderResult } from "../services/checkout-order.service";

export interface GetOrderByCheckoutQuery extends IQuery {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetOrderByCheckoutHandler implements IQueryHandler<GetOrderByCheckoutQuery, OrderResult | null> {
  constructor(private readonly checkoutOrderService: CheckoutOrderService) {}

  async handle(query: GetOrderByCheckoutQuery): Promise<OrderResult | null> {
    return this.checkoutOrderService.getOrderByCheckoutId(
      query.checkoutId,
      query.userId,
      query.guestToken,
    );
  }
}
