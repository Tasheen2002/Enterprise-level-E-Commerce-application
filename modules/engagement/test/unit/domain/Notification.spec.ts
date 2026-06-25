import { describe, it, expect } from "vitest";
import {
  Notification,
  NotificationId,
  NotificationType,
  ChannelType,
  NotificationStatus,
  DomainValidationError,
  NotificationRetryError,
  NotificationCreatedEvent,
  NotificationStatusChangedEvent
} from "@modules/engagement/domain";

describe("Notification Aggregate Root", () => {
  it("should successfully create a pending notification and emit NotificationCreatedEvent", () => {
    const notification = Notification.create({
      type: NotificationType.create("restock"),
      payload: { message: "Variant 123 is back in stock!" },
      channel: ChannelType.EMAIL,
      templateId: "temp-999"
    });

    expect(notification.id).toBeInstanceOf(NotificationId);
    expect(notification.type.getValue()).toBe("restock");
    expect(notification.payload.message).toBe("Variant 123 is back in stock!");
    expect(notification.channel?.equals(ChannelType.EMAIL)).toBe(true);
    expect(notification.templateId).toBe("temp-999");
    expect(notification.status.equals(NotificationStatus.PENDING)).toBe(true);
    expect(notification.isPending()).toBe(true);
    expect(notification.isScheduled()).toBe(false);

    const events = notification.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NotificationCreatedEvent);
    expect((events[0] as NotificationCreatedEvent).type).toBe("restock");
  });

  it("should successfully create a scheduled notification when scheduledAt is set in the future", () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const notification = Notification.create({
      type: NotificationType.create("promo"),
      payload: { promoCode: "BespokeVIP" },
      scheduledAt: futureDate
    });

    expect(notification.status.equals(NotificationStatus.SCHEDULED)).toBe(true);
    expect(notification.isScheduled()).toBe(true);
    expect(notification.scheduledAt).toBe(futureDate);
  });

  it("should throw DomainValidationError if scheduledAt is in the past", () => {
    const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(() => {
      Notification.create({
        type: NotificationType.create("promo"),
        payload: { promoCode: "BespokeVIP" },
        scheduledAt: pastDate
      });
    }).toThrow(DomainValidationError);
  });

  it("should support updating payload", () => {
    const notification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });

    notification.updatePayload({ trackingNumber: "TRK-987" });
    expect(notification.payload.orderId).toBe("ord-123");
    expect(notification.payload.trackingNumber).toBe("TRK-987");
  });

  it("should support scheduling a notification in the future", () => {
    const notification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });

    const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
    notification.schedule(futureDate);

    expect(notification.isScheduled()).toBe(true);
    expect(notification.scheduledAt).toBe(futureDate);

    expect(() => notification.schedule(new Date(Date.now() - 1000))).toThrow(DomainValidationError);
  });

  it("should support status transitions: sending, sent, failed", () => {
    const notification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });

    // sending
    notification.markAsSending();
    expect(notification.isSending()).toBe(true);

    // sent
    notification.markAsSent();
    expect(notification.isSent()).toBe(true);
    expect(notification.sentAt).toBeInstanceOf(Date);

    // failed
    const failedNotification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });
    failedNotification.markAsFailed("SMTP connect timeout");
    expect(failedNotification.isFailed()).toBe(true);
    expect(failedNotification.error).toBe("SMTP connect timeout");
  });

  it("should support retry on failed notifications", () => {
    const notification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });

    // Retry non-failed should throw error
    expect(() => notification.retry()).toThrow(NotificationRetryError);

    // Mark failed then retry
    notification.markAsFailed("Error message");
    notification.retry();
    expect(notification.isPending()).toBe(true);
    expect(notification.error).toBeUndefined();
  });

  it("should compute isDue correctly", () => {
    const notification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" }
    });
    expect(notification.isDue()).toBe(true);

    const futureDate = new Date(Date.now() + 5000);
    const scheduledNotification = Notification.create({
      type: NotificationType.create("shipped"),
      payload: { orderId: "ord-123" },
      scheduledAt: futureDate
    });
    expect(scheduledNotification.isDue()).toBe(false);
  });
});
