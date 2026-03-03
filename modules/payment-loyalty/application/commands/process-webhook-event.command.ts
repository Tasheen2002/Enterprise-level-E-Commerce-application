import { ICommand } from "@/api/src/shared/application";
import { WebhookEventData } from "../../domain/entities/payment-webhook-event.entity";

export interface ProcessWebhookEventCommand extends ICommand {
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  signature?: string;
}
