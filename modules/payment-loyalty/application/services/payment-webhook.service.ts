import {
  IPaymentWebhookEventRepository,
  WebhookEventFilterOptions,
} from "../../domain/repositories/payment-webhook-event.repository";
import {
  PaymentWebhookEvent,
  WebhookEventData,
} from "../../domain/entities/payment-webhook-event.entity";
import * as crypto from "crypto";

export interface CreateWebhookEventDto {
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  signature?: string;
}

export interface PaymentWebhookEventDto {
  eventId: string;
  provider: string;
  eventType: string;
  eventData: WebhookEventData;
  createdAt: Date;
}

export class PaymentWebhookService {
  constructor(
    private readonly webhookEventRepo: IPaymentWebhookEventRepository,
  ) {}

  private verifySignature(
    provider: string,
    eventData: WebhookEventData,
    signature?: string,
  ) {
    const secretMap: Record<string, string | undefined> = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET,
      paypal: process.env.PAYPAL_WEBHOOK_SECRET,
      razorpay: process.env.RAZORPAY_WEBHOOK_SECRET,
    };

    const secret = secretMap[provider];
    if (!secret) {
      // No secret configured; nothing to verify
      return;
    }

    if (!signature) {
      throw new Error("Missing webhook signature");
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
      throw new Error("Invalid webhook signature");
    }
  }

  async recordWebhookEvent(
    dto: CreateWebhookEventDto,
  ): Promise<PaymentWebhookEventDto> {
    this.verifySignature(dto.provider, dto.eventData, dto.signature);

    const event = PaymentWebhookEvent.create({
      provider: dto.provider,
      eventType: dto.eventType,
      eventData: dto.eventData,
    });

    await this.webhookEventRepo.save(event);

    return this.toDto(event);
  }

  async getWebhookEvent(
    eventId: string,
  ): Promise<PaymentWebhookEventDto | null> {
    const event = await this.webhookEventRepo.findById(eventId);
    return event ? this.toDto(event) : null;
  }

  async getWebhookEventsByProvider(
    provider: string,
  ): Promise<PaymentWebhookEventDto[]> {
    const events = await this.webhookEventRepo.findByProvider(provider);
    return events.map((e) => this.toDto(e));
  }

  async getWebhookEventsWithFilters(
    filters: WebhookEventFilterOptions,
  ): Promise<PaymentWebhookEventDto[]> {
    const events = await this.webhookEventRepo.findWithFilters(filters);
    return events.map((e) => this.toDto(e));
  }

  async countWebhookEvents(
    filters?: WebhookEventFilterOptions,
  ): Promise<number> {
    return await this.webhookEventRepo.count(filters);
  }

  private toDto(event: PaymentWebhookEvent): PaymentWebhookEventDto {
    return {
      eventId: event.eventId,
      provider: event.provider,
      eventType: event.eventType,
      eventData: event.eventData,
      createdAt: event.createdAt,
    };
  }
}
