import {
  IQuery,
  IQueryHandler,
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
  PaymentWebhookEventDto[]
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(query: GetWebhookEventsQuery): Promise<PaymentWebhookEventDto[]> {
    return this.webhookService.getWebhookEventsWithFilters({
      provider: query.provider,
      eventType: query.eventType,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
    });
  }
}
