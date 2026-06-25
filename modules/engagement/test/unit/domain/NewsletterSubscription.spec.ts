import { describe, it, expect } from "vitest";
import {
  NewsletterSubscription,
  SubscriptionId,
  SubscriptionStatus,
  DomainValidationError,
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent
} from "@modules/engagement/domain";

describe("NewsletterSubscription Aggregate Root", () => {
  it("should successfully create an active newsletter subscription and emit SubscriptionCreatedEvent", () => {
    const subscription = NewsletterSubscription.create({
      email: "CUSTOMER@example.com",
      source: "footer_signup"
    });

    expect(subscription.id).toBeInstanceOf(SubscriptionId);
    expect(subscription.email).toBe("customer@example.com"); // check lowercasing
    expect(subscription.source).toBe("footer_signup");
    expect(subscription.status.equals(SubscriptionStatus.ACTIVE)).toBe(true);
    expect(subscription.isActive()).toBe(true);
    expect(subscription.canReceiveEmails()).toBe(true);

    const events = subscription.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubscriptionCreatedEvent);
    expect((events[0] as SubscriptionCreatedEvent).email).toBe("customer@example.com");
  });

  it("should throw DomainValidationError for empty email", () => {
    expect(() => {
      NewsletterSubscription.create({
        email: "   ",
        source: "popup"
      });
    }).toThrow(DomainValidationError);
  });

  it("should throw DomainValidationError for invalid email formats", () => {
    const invalidEmails = ["invalid-email", "invalid@com", "@example.com", "abc@example."];

    invalidEmails.forEach((email) => {
      expect(() => {
        NewsletterSubscription.create({ email });
      }).toThrow(DomainValidationError);
    });
  });

  it("should support status transitions: unsubscribe, bounce, spam, activate", () => {
    const subscription = NewsletterSubscription.create({
      email: "subscriber@example.com"
    });

    // 1. Unsubscribe
    subscription.clearDomainEvents();
    subscription.unsubscribe();
    expect(subscription.isUnsubscribed()).toBe(true);
    expect(subscription.canReceiveEmails()).toBe(false);

    let events = subscription.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubscriptionStatusChangedEvent);
    expect((events[0] as SubscriptionStatusChangedEvent).newStatus).toBe("unsubscribed");

    // 2. Bounce
    subscription.bounce();
    expect(subscription.isBounced()).toBe(true);
    expect(subscription.canReceiveEmails()).toBe(false);

    // 3. Spam
    subscription.markAsSpam();
    expect(subscription.isSpam()).toBe(true);
    expect(subscription.canReceiveEmails()).toBe(false);

    // 4. Activate
    subscription.activate();
    expect(subscription.isActive()).toBe(true);
    expect(subscription.canReceiveEmails()).toBe(true);
  });
});
