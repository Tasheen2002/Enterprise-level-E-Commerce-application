import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { CheckoutService, CheckoutDto } from "../services/checkout.service";

export interface GetCheckoutQuery extends IQuery {
  checkoutId: string;
  userId?: string;
  guestToken?: string;
}

export class GetCheckoutHandler implements IQueryHandler<GetCheckoutQuery, QueryResult<CheckoutDto>> {
  constructor(private readonly checkoutService: CheckoutService) {}

  async handle(query: GetCheckoutQuery): Promise<QueryResult<CheckoutDto>> {
    const checkout = await this.checkoutService.getCheckout(
      query.checkoutId,
      query.userId,
      query.guestToken,
    );
    return QueryResult.success<CheckoutDto>(checkout!);
  }
}
