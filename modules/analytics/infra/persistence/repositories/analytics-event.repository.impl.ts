import { PrismaClient } from "@prisma/client";
import { AnalyticsEvent } from "../../../domain/entities/analytics-event.entity";
import { AnalyticsEventRepository } from "../../../domain/repositories/analytics-event.repository";

export class AnalyticsEventRepositoryImpl implements AnalyticsEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(event: AnalyticsEvent): Promise<void> {
    const data = event.toDatabaseRow();

    await this.prisma.analyticsEvent.create({
      data: {
        id: data.event_id,
        eventType: data.event_type,
        userId: data.user_id,
        guestToken: data.guest_token,
        sessionId: data.session_id,
        productId: data.product_id,
        variantId: data.variant_id,
        cartId: data.cart_id,
        eventData: data.event_data,
        userAgent: data.user_agent,
        ipAddress: data.ip_address,
        referrer: data.referrer,
        eventTimestamp: data.event_timestamp,
        createdAt: data.created_at,
      },
    });
  }

  async saveMany(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;

    const data = events.map((event) => {
      const row = event.toDatabaseRow();
      return {
        id: row.event_id,
        eventType: row.event_type,
        userId: row.user_id,
        guestToken: row.guest_token,
        sessionId: row.session_id,
        productId: row.product_id,
        variantId: row.variant_id,
        cartId: row.cart_id,
        eventData: row.event_data,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        referrer: row.referrer,
        eventTimestamp: row.event_timestamp,
        createdAt: row.created_at,
      };
    });

    await this.prisma.analyticsEvent.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findByProductId(
    productId: string,
    variantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    const where: any = {
      productId: productId,
    };

    if (variantId) {
      where.variantId = variantId;
    }

    if (startDate) {
      where.eventTimestamp = { ...where.eventTimestamp, gte: startDate };
    }

    if (endDate) {
      where.eventTimestamp = { ...where.eventTimestamp, lte: endDate };
    }

    const rows = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { eventTimestamp: "asc" },
    });

    return rows.map((row) =>
      AnalyticsEvent.reconstitute({
        eventId: row.id,
        eventType: row.eventType,
        userId: row.userId ?? undefined,
        guestToken: row.guestToken ?? undefined,
        sessionId: row.sessionId,
        productId: row.productId ?? undefined,
        variantId: row.variantId ?? undefined,
        cartId: row.cartId ?? undefined,
        eventData: row.eventData,
        userAgent: row.userAgent ?? undefined,
        ipAddress: row.ipAddress ?? undefined,
        referrer: row.referrer ?? undefined,
        eventTimestamp: row.eventTimestamp,
        createdAt: row.createdAt,
      })
    );
  }

  async findBySessionId(
    sessionId: string,
    limit: number = 100
  ): Promise<AnalyticsEvent[]> {
    const rows = await this.prisma.analyticsEvent.findMany({
      where: { sessionId: sessionId },
      orderBy: { eventTimestamp: "asc" },
      take: limit,
    });

    return rows.map((row) =>
      AnalyticsEvent.reconstitute({
        eventId: row.id,
        eventType: row.eventType,
        userId: row.userId ?? undefined,
        guestToken: row.guestToken ?? undefined,
        sessionId: row.sessionId,
        productId: row.productId ?? undefined,
        variantId: row.variantId ?? undefined,
        cartId: row.cartId ?? undefined,
        eventData: row.eventData,
        userAgent: row.userAgent ?? undefined,
        ipAddress: row.ipAddress ?? undefined,
        referrer: row.referrer ?? undefined,
        eventTimestamp: row.eventTimestamp,
        createdAt: row.createdAt,
      })
    );
  }

  async findByUserId(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    const where: any = { userId: userId };

    if (startDate) {
      where.eventTimestamp = { ...where.eventTimestamp, gte: startDate };
    }

    if (endDate) {
      where.eventTimestamp = { ...where.eventTimestamp, lte: endDate };
    }

    const rows = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { eventTimestamp: "asc" },
    });

    return rows.map((row) =>
      AnalyticsEvent.reconstitute({
        eventId: row.id,
        eventType: row.eventType,
        userId: row.userId ?? undefined,
        guestToken: row.guestToken ?? undefined,
        sessionId: row.sessionId,
        productId: row.productId ?? undefined,
        variantId: row.variantId ?? undefined,
        cartId: row.cartId ?? undefined,
        eventData: row.eventData,
        userAgent: row.userAgent ?? undefined,
        ipAddress: row.ipAddress ?? undefined,
        referrer: row.referrer ?? undefined,
        eventTimestamp: row.eventTimestamp,
        createdAt: row.createdAt,
      })
    );
  }

  async findByGuestToken(
    guestToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    const where: any = { guestToken: guestToken };

    if (startDate) {
      where.eventTimestamp = { ...where.eventTimestamp, gte: startDate };
    }

    if (endDate) {
      where.eventTimestamp = { ...where.eventTimestamp, lte: endDate };
    }

    const rows = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { eventTimestamp: "asc" },
    });

    return rows.map((row) =>
      AnalyticsEvent.reconstitute({
        eventId: row.id,
        eventType: row.eventType,
        userId: row.userId ?? undefined,
        guestToken: row.guestToken ?? undefined,
        sessionId: row.sessionId,
        productId: row.productId ?? undefined,
        variantId: row.variantId ?? undefined,
        cartId: row.cartId ?? undefined,
        eventData: row.eventData,
        userAgent: row.userAgent ?? undefined,
        ipAddress: row.ipAddress ?? undefined,
        referrer: row.referrer ?? undefined,
        eventTimestamp: row.eventTimestamp,
        createdAt: row.createdAt,
      })
    );
  }
}
