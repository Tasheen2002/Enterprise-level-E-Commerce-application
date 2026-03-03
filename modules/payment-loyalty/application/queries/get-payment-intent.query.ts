import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PaymentService,
  PaymentIntentDto,
} from "../services/payment.service";

export interface GetPaymentIntentQuery extends IQuery {
  intentId?: string;
  orderId?: string;
  userId?: string;
}

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

      let intent: PaymentIntentDto | null = null;
      if (query.intentId) {
        intent = await this.paymentService.getPaymentIntent(
          query.intentId,
          query.userId,
        );
      } else if (query.orderId) {
        intent = await this.paymentService.getPaymentIntentByOrderId(
          query.orderId,
          query.userId,
        );
      }

      if (!intent) {
        return QueryResult.failure<PaymentIntentDto>(
          "Payment intent not found",
        );
      }

      return QueryResult.success<PaymentIntentDto>(intent);
    } catch (error) {
      return QueryResult.failure<PaymentIntentDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while retrieving payment intent",
      );
    }
  }
}
