import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PaymentService,
  PaymentIntentDto,
} from "../../services/payment.service";
import { GetPaymentIntentQuery } from "./get-payment-intent.query";

export class GetPaymentIntentHandler implements IQueryHandler<
  GetPaymentIntentQuery,
  QueryResult<PaymentIntentDto>
> {
  constructor(private readonly paymentService: PaymentService) {}

  async handle(
    query: GetPaymentIntentQuery,
  ): Promise<QueryResult<PaymentIntentDto>> {
    try {
      if (!query.intentId && !query.orderId) {
        return QueryResult.failure<PaymentIntentDto>(
          "Either intentId or orderId is required",
        );
      }

      const intent: PaymentIntentDto = query.intentId
        ? await this.paymentService.getPaymentIntent(
            query.intentId,
            query.userId,
          )
        : await this.paymentService.getPaymentIntentByOrderId(
            query.orderId!,
            query.userId,
          );

      return QueryResult.success<PaymentIntentDto>(intent);
    } catch (error) {
      return QueryResult.failure<PaymentIntentDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving payment intent",
      );
    }
  }
}
