import {
  PaymentWebhookService,
  PaymentWebhookEventDto,
} from "../services/payment-webhook.service";
import { WebhookEventData } from "../../domain/entities/payment-webhook-event.entity";
import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from "@/api/src/shared/application";

export interface ProcessWebhookEventCommand extends ICommand {
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  signature?: string;
}

export class ProcessWebhookEventHandler implements ICommandHandler<
  ProcessWebhookEventCommand,
  CommandResult<PaymentWebhookEventDto>
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(
    command: ProcessWebhookEventCommand,
  ): Promise<CommandResult<PaymentWebhookEventDto>> {
    try {
      const errors: string[] = [];
      if (!command.provider) errors.push("provider");
      if (!command.eventType) errors.push("eventType");
      if (!command.eventData) errors.push("eventData");
      if (errors.length > 0) {
        return CommandResult.failure<PaymentWebhookEventDto>(
          "Validation failed",
          errors,
        );
      }

      const event = await this.webhookService.recordWebhookEvent({
        provider: command.provider,
        eventType: command.eventType,
        eventData: command.eventData,
        signature: command.signature,
      });
      return CommandResult.success<PaymentWebhookEventDto>(event);
    } catch (error) {
      return CommandResult.failure<PaymentWebhookEventDto>(
        error instanceof Error ? error.message : "An unexpected error occurred while processing webhook event",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
