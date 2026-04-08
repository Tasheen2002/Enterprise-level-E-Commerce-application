import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  PaymentWebhookService,
  PaymentWebhookEventDto,
} from "../../services/payment-webhook.service";
import { GetWebhookEventsQuery } from "./get-webhook-events.query";

export class GetWebhookEventsHandler implements IQueryHandler<
  GetWebhookEventsQuery,
  QueryResult<PaymentWebhookEventDto[]>
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(
    query: GetWebhookEventsQuery,
  ): Promise<QueryResult<PaymentWebhookEventDto[]>> {
    try {
      const events = await this.webhookService.getWebhookEventsWithFilters({
        provider: query.provider,
        eventType: query.eventType,
        createdAfter: query.createdAfter,
        createdBefore: query.createdBefore,
      });
      return QueryResult.success<PaymentWebhookEventDto[]>(events);
    } catch (error) {
      return QueryResult.failure<PaymentWebhookEventDto[]>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving webhook events",
      );
    }
  }
}
