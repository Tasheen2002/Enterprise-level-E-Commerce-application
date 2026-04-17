import { FastifyRequest, FastifyReply } from "fastify";
import {
  ProcessWebhookEventHandler,
  GetWebhookEventsHandler,
} from "../../../application";
import { WebhookEventData } from "../../../domain/entities/payment-webhook-event.entity";
import { ResponseHelper } from "@/api/src/shared/response.helper";

export interface WebhookFilterParams {
  provider?: string;
  eventType?: string;
}

export class PaymentWebhookController {
  constructor(
    private readonly processHandler: ProcessWebhookEventHandler,
    private readonly listHandler: GetWebhookEventsHandler,
  ) {}

  async processWebhook(
    request: FastifyRequest<{ Params: { provider: string }; Body: WebhookEventData }>,
    reply: FastifyReply,
  ) {
    try {
      const { provider } = request.params;
      const eventData = request.body;
      const signature = request.headers["stripe-signature"] as string | undefined;

      const result = await this.processHandler.handle({
        provider,
        eventType: (eventData as any)?.type || (eventData as any)?.event_type || "unknown",
        eventData,
        signature,
        timestamp: new Date(),
      });
      return ResponseHelper.fromCommand(reply, result, "Webhook event processed");
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }

  async listWebhookEvents(
    request: FastifyRequest<{ Querystring: WebhookFilterParams }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.listHandler.handle({
        provider: request.query.provider,
        eventType: request.query.eventType,
        timestamp: new Date(),
      });
      return ResponseHelper.ok(reply, "Webhook events retrieved", result);
    } catch (error: unknown) {
      return ResponseHelper.error(reply, error);
    }
  }
}
