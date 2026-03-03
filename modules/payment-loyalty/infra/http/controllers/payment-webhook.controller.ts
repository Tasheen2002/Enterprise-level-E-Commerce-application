import { FastifyRequest, FastifyReply } from "fastify";
import {
  ProcessWebhookEventCommand,
  ProcessWebhookEventHandler,
  GetWebhookEventsQuery,
  GetWebhookEventsHandler,
} from "../../../application";
import { PaymentWebhookService } from "../../../application/services/payment-webhook.service";
import { WebhookEventData } from "../../../domain/entities/payment-webhook-event.entity";

export interface ProcessWebhookRequest {
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
}

export interface WebhookFilterParams {
  provider?: string;
  eventType?: string;
  limit?: number;
}

export class PaymentWebhookController {
  private processHandler: ProcessWebhookEventHandler;
  private listHandler: GetWebhookEventsHandler;

  constructor(private readonly webhookService: PaymentWebhookService) {
    this.processHandler = new ProcessWebhookEventHandler(webhookService);
    this.listHandler = new GetWebhookEventsHandler(webhookService);
  }

  /**
   * POST /webhooks/:provider
   * Process incoming webhook event from payment provider
   */
  async processWebhook(
    request: FastifyRequest<{ Params: { provider: string }; Body: any }>,
    reply: FastifyReply,
  ) {
    const { provider } = request.params;
    const eventData = request.body as any;
    const signature = request.headers["stripe-signature"] as string | undefined;

    const cmd: ProcessWebhookEventCommand = {
      provider,
      eventType: eventData?.type || eventData?.event_type || "unknown",
      eventData: eventData as WebhookEventData,
      signature,
      timestamp: new Date(),
    };
    const result = await this.processHandler.handle(cmd);
    return reply.code(result.success ? 200 : 400).send(result);
  }

  /**
   * GET /webhooks
   * List webhook events with optional filters
   */
  async listWebhookEvents(
    request: FastifyRequest<{ Querystring: WebhookFilterParams }>,
    reply: FastifyReply,
  ) {
    const { provider, eventType } = request.query;
    const query: GetWebhookEventsQuery = {
      provider,
      eventType,
      timestamp: new Date(),
    };
    const result = await this.listHandler.handle(query);
    return reply.code(result.success ? 200 : 400).send(result);
  }
}
