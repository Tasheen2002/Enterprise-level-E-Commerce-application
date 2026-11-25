import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AnalyticsEventRepositoryImpl } from "@modules/analytics/infra/persistence/repositories/analytics-event.repository.impl";
import { AnalyticsEvent } from "@modules/analytics/domain/entities/analytics-event.entity";
import { EventType, SessionId, UserContext } from "@modules/analytics/domain/value-objects";

// Guest tokens open a guest's cart and orders, so analytics stores a keyed
// hash: a guest's events can still be grouped and looked up, but the stored
// value cannot be used as a credential.
const prisma = new PrismaClient();
const repository = new AnalyticsEventRepositoryImpl(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("analytics guest privacy", () => {
  it("stores a pseudonym instead of the guest token and still finds the guest's events", async () => {
    const guestToken = `guest_${randomUUID()}`;
    const sessionId = `session-${randomUUID()}`;
    await repository.save(
      AnalyticsEvent.create({
        eventType: EventType.addToCart(),
        userContext: UserContext.forGuest(guestToken),
        sessionId: SessionId.create(sessionId),
      }),
    );
    const rows = await prisma.analyticsEvent.findMany({ where: { sessionId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].guestToken).toMatch(/^gt_/);
    expect(rows[0].guestToken).not.toContain(guestToken);

    const found = await repository.findByGuestToken(guestToken);
    expect(found.some((event) => event.getSessionId().getValue() === sessionId)).toBe(true);
  });
});
