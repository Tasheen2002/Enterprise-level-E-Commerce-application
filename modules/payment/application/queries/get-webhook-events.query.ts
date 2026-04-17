import {
  IQuery,
  IQueryHandler,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentWebhookService } from '../services/payment-webhook.service';
import { PaymentWebhookEventDTO } from '../../domain/entities/payment-webhook-event.entity';

export interface GetWebhookEventsQuery extends IQuery {
  readonly provider?: string;
  readonly eventType?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export class GetWebhookEventsHandler implements IQueryHandler<
  GetWebhookEventsQuery,
  PaymentWebhookEventDTO[]
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(query: GetWebhookEventsQuery): Promise<PaymentWebhookEventDTO[]> {
    return this.webhookService.getWebhookEvents({
      provider: query.provider,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
    });
  }
}
