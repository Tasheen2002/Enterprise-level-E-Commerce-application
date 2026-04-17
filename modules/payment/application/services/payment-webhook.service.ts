import {
  IPaymentWebhookEventRepository,
  WebhookEventFilters,
} from "../../domain/repositories/payment-webhook-event.repository";
import {
  PaymentWebhookEvent,
  PaymentWebhookEventDTO,
  WebhookEventData,
} from "../../domain/entities/payment-webhook-event.entity";
import { WebhookEventId } from "../../domain/value-objects/webhook-event-id.vo";
import { WebhookEventType } from "../../domain/value-objects/webhook-event-type.vo";
import * as crypto from "crypto";
import {
  DomainValidationError,
  InvalidOperationError,
} from "../../domain/errors/payment-loyalty.errors";

export type { PaymentWebhookEventDTO } from "../../domain/entities/payment-webhook-event.entity";

interface CreateWebhookEventParams {
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  signature?: string;
}

interface WebhookSecrets {
  stripe?: string;
  paypal?: string;
  razorpay?: string;
}

export class PaymentWebhookService {
  constructor(
    private readonly webhookEventRepo: IPaymentWebhookEventRepository,
    private readonly webhookSecrets: WebhookSecrets,
  ) {}

  private verifySignature(
    provider: string,
    eventData: WebhookEventData,
    signature?: string,
  ): void {
    const secretMap: Record<string, string | undefined> = {
      stripe: this.webhookSecrets.stripe,
      paypal: this.webhookSecrets.paypal,
      razorpay: this.webhookSecrets.razorpay,
    };

    const secret = secretMap[provider];
    if (!secret) return;

    if (!signature) {
      throw new DomainValidationError("Missing webhook signature");
    }

    const payload =
      typeof eventData === "string"
        ? eventData
        : JSON.stringify(eventData ?? {});

    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    const safeEqual =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!safeEqual) {
      throw new InvalidOperationError("Invalid webhook signature");
    }
  }

  async recordWebhookEvent(params: CreateWebhookEventParams): Promise<PaymentWebhookEventDTO> {
    this.verifySignature(params.provider, params.eventData, params.signature);

    const event = PaymentWebhookEvent.create({
      provider: params.provider,
      eventType: WebhookEventType.create(params.eventType),
      eventData: params.eventData,
    });

    await this.webhookEventRepo.save(event);
    return PaymentWebhookEvent.toDTO(event);
  }

  async getWebhookEvent(eventId: string): Promise<PaymentWebhookEventDTO | null> {
    const event = await this.webhookEventRepo.findById(WebhookEventId.fromString(eventId));
    return event ? PaymentWebhookEvent.toDTO(event) : null;
  }

  async getWebhookEventsByProvider(provider: string): Promise<PaymentWebhookEventDTO[]> {
    const events = await this.webhookEventRepo.findByProvider(provider);
    return events.map((e) => PaymentWebhookEvent.toDTO(e));
  }

  async getWebhookEvents(filters: WebhookEventFilters): Promise<PaymentWebhookEventDTO[]> {
    const result = await this.webhookEventRepo.findWithFilters(filters);
    return result.items.map((e) => PaymentWebhookEvent.toDTO(e));
  }
}
