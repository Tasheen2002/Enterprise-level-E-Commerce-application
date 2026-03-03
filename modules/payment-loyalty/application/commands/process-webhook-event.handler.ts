import {
  PaymentWebhookService,
  PaymentWebhookEventDto,
} from "../services/payment-webhook.service";
import { ICommandHandler, CommandResult } from "@/api/src/shared/application";
import { ProcessWebhookEventCommand } from "./process-webhook-event.command";

export class ProcessWebhookEventHandler implements ICommandHandler<
  ProcessWebhookEventCommand,
  CommandResult<PaymentWebhookEventDto>
> {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  async handle(
    command: ProcessWebhookEventCommand,
  ): Promise<CommandResult<PaymentWebhookEventDto>> {
    try {
      const event = await this.webhookService.recordWebhookEvent({
        provider: command.provider,
        eventType: command.eventType,
        eventData: command.eventData,
        signature: command.signature,
      });
      return CommandResult.success<PaymentWebhookEventDto>(event);
    } catch (error) {
      return CommandResult.failure<PaymentWebhookEventDto>(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing webhook event",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}
