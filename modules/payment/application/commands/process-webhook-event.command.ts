import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { PaymentWebhookService } from '../services/payment-webhook.service';
import { PaymentWebhookEventDTO } from '../../domain/entities/payment-webhook-event.entity';
import { WebhookEventData } from '../../domain/entities/payment-webhook-event.entity';

export interface ProcessWebhookEventCommand extends ICommand {
  readonly provider: string;
  readonly eventType: string;
  readonly eventData: WebhookEventData;
  readonly signature?: string;
}

export class ProcessWebhookEventHandler implements ICommandHandler<
  ProcessWebhookEventCommand,
  CommandResult<PaymentWebhookEventDTO>
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(command: ProcessWebhookEventCommand): Promise<CommandResult<PaymentWebhookEventDTO>> {
    const event = await this.webhookService.recordWebhookEvent({
      provider: command.provider,
      eventType: command.eventType,
      eventData: command.eventData,
      signature: command.signature,
    });
    return CommandResult.success(event);
  }
}
