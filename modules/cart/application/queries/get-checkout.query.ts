import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDTO } from "../services/checkout.service";
import { CheckoutNotFoundError } from "../../domain/errors";

export interface GetCheckoutQuery extends IQuery {
  readonly checkoutId: string;
  readonly userId?: string;
  readonly guestToken?: string;
}

export class GetCheckoutHandler implements IQueryHandler<GetCheckoutQuery, CheckoutDTO> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(query: GetCheckoutQuery): Promise<CheckoutDTO> {
    const checkout = await this.checkoutService.getCheckout(
      query.checkoutId,
      query.userId,
      query.guestToken,
    );
    if (checkout === null) throw new CheckoutNotFoundError(query.checkoutId);
    return checkout;
  }
}
