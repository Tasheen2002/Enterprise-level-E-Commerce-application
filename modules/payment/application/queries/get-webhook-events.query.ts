import {
  IQuery,
  IQueryHandler,
  QueryResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentWebhookService, PaymentWebhookEventDto } from '../services/payment-webhook.service';

export interface GetWebhookEventsQuery extends IQuery {
  readonly provider?: string;
  readonly eventType?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export class GetWebhookEventsHandler implements IQueryHandler<
  GetWebhookEventsQuery,
  QueryResult<PaymentWebhookEventDto[]>
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(query: GetWebhookEventsQuery): Promise<QueryResult<PaymentWebhookEventDto[]>> {
    const events = await this.webhookService.getWebhookEventsWithFilters({
      provider: query.provider,
      eventType: query.eventType,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
    });
    return QueryResult.success(events);
  }
}
