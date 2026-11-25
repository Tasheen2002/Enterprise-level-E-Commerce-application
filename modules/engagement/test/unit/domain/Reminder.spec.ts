import { describe, it, expect } from "vitest";
import {
  Reminder,
  ReminderId,
  ReminderType,
  ContactType,
  ChannelType,
  ReminderStatus,
  DomainValidationError,
  InvalidOperationError,
  ReminderCreatedEvent,
  ReminderStatusChangedEvent
} from "@modules/engagement/domain";

describe("Reminder Aggregate Root", () => {
  it("should successfully create a reminder and emit ReminderCreatedEvent", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    expect(reminder.id).toBeInstanceOf(ReminderId);
    expect(reminder.type.equals(ReminderType.RESTOCK)).toBe(true);
    expect(reminder.variantId).toBe("variant-123");
    expect(reminder.userId).toBe("user-456");
    expect(reminder.contact.equals(ContactType.EMAIL)).toBe(true);
    expect(reminder.channel.equals(ChannelType.EMAIL)).toBe(true);
    expect(reminder.status.equals(ReminderStatus.PENDING)).toBe(true);
    expect(reminder.isPending()).toBe(true);
    expect(reminder.isSent()).toBe(false);
    expect(reminder.isUnsubscribed()).toBe(false);

    const events = reminder.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ReminderCreatedEvent);
    expect((events[0] as ReminderCreatedEvent).variantId).toBe("variant-123");
  });

  it("should throw DomainValidationError if variant ID is empty", () => {
    expect(() => {
      Reminder.create({
        type: ReminderType.RESTOCK,
        variantId: "   ",
        userId: "user-456",
        contact: ContactType.EMAIL,
        channel: ChannelType.EMAIL
      });
    }).toThrow(DomainValidationError);
  });

  it("should support optIn status change", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    expect(reminder.optInAt).toBeUndefined();
    reminder.optIn();
    expect(reminder.optInAt).toBeInstanceOf(Date);
  });

  it("should support markAsSent and emit ReminderStatusChangedEvent", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    reminder.clearDomainEvents();
    reminder.markAsSent();

    expect(reminder.status.equals(ReminderStatus.SENT)).toBe(true);
    expect(reminder.isSent()).toBe(true);

    const events = reminder.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ReminderStatusChangedEvent);
    expect((events[0] as ReminderStatusChangedEvent).oldStatus).toBe("pending");
    expect((events[0] as ReminderStatusChangedEvent).newStatus).toBe("sent");
  });

  it("should throw InvalidOperationError if marking a non-pending reminder as sent", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    reminder.markAsSent();
    expect(() => reminder.markAsSent()).toThrow(InvalidOperationError);
  });

  it("should support unsubscribe and emit ReminderStatusChangedEvent", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    reminder.clearDomainEvents();
    reminder.unsubscribe();

    expect(reminder.status.equals(ReminderStatus.UNSUBSCRIBED)).toBe(true);
    expect(reminder.isUnsubscribed()).toBe(true);

    const events = reminder.domainEvents;
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ReminderStatusChangedEvent);
    expect((events[0] as ReminderStatusChangedEvent).oldStatus).toBe("pending");
    expect((events[0] as ReminderStatusChangedEvent).newStatus).toBe("unsubscribed");
  });

  it("should throw InvalidOperationError if unsubscribing an already unsubscribed reminder", () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      userId: "user-456",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    reminder.unsubscribe();
    expect(() => reminder.unsubscribe()).toThrow(InvalidOperationError);
  });

  it("should support checking reminder types", () => {
    const restockReminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId: "variant-123",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    const priceDropReminder = Reminder.create({
      type: ReminderType.PRICE_DROP,
      variantId: "variant-123",
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    expect(restockReminder.isRestockReminder()).toBe(true);
    expect(restockReminder.isPriceDropReminder()).toBe(false);

    expect(priceDropReminder.isRestockReminder()).toBe(false);
    expect(priceDropReminder.isPriceDropReminder()).toBe(true);
  });
});
