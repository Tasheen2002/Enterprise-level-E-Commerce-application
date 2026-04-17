import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDto } from "../services/checkout.service";

export interface GetCheckoutQuery extends IQuery {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCheckoutHandler implements IQueryHandler<GetCheckoutQuery, CheckoutDto | null> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(query: GetCheckoutQuery): Promise<CheckoutDto | null> {
    return this.checkoutService.getCheckout(
      query.checkoutId,
      query.userId,
      query.guestToken,
    );
  }
}
