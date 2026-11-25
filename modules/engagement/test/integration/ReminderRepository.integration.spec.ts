import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ReminderRepositoryImpl } from "@modules/engagement/infra/persistence/repositories/reminder.repository.impl";
import { Reminder } from "@modules/engagement/domain/entities/reminder.entity";
import { ReminderId, ReminderType, ContactType, ChannelType } from "@modules/engagement/domain/value-objects";

const prisma = new PrismaClient();

describe("ReminderRepositoryImpl Database Integration Tests", () => {
  let repository: ReminderRepositoryImpl;
  let variantId: string;
  let userId: string;

  beforeAll(() => {
    repository = new ReminderRepositoryImpl(prisma);
  });

  beforeEach(async () => {
    // 1. Create a Product & Variant
    const productId = randomUUID();
    const varId = randomUUID();
    await prisma.product.create({
      data: {
        id: productId,
        title: "Integration Test Product",
        slug: `integration-reminder-${randomUUID()}`,
        price: 100,
        currency: "USD",
        status: "published"
      }
    });

    await prisma.productVariant.create({
      data: {
        id: varId,
        productId,
        sku: `SKU-RM-${Date.now()}-${randomUUID()}`,
        price: 100
      }
    });
    variantId = varId;

    // 2. Create a User
    const uId = randomUUID();
    await prisma.user.create({
      data: {
        id: uId,
        email: `reminder-user-${randomUUID()}@example.com`,
        role: "CUSTOMER",
        status: "active"
      }
    });
    userId = uId;
  });

  it("should save and retrieve a reminder successfully", async () => {
    // Arrange
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId,
      userId,
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });

    // Act
    await repository.save(reminder);

    // Assert
    const retrieved = await repository.findById(reminder.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.variantId).toBe(variantId);
    expect(retrieved!.userId).toBe(userId);
    expect(retrieved!.contact.equals(ContactType.EMAIL)).toBe(true);
    expect(retrieved!.channel.equals(ChannelType.EMAIL)).toBe(true);
    expect(retrieved!.isPending()).toBe(true);
  });

  it("should support querying reminders by status, type, variant, and user", async () => {
    const reminder1 = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId,
      userId,
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });
    await repository.save(reminder1);

    const reminder2 = Reminder.create({
      type: ReminderType.PRICE_DROP,
      variantId,
      userId,
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });
    await repository.save(reminder2);

    // Find by user
    const userRes = await repository.findByUserId(userId);
    expect(userRes.total).toBe(2);
    expect(userRes.items).toHaveLength(2);

    // Find by variant
    const variantRes = await repository.findByVariantId(variantId);
    expect(variantRes.total).toBe(2);

    // Find by type
    const typeRes = await repository.findByType("restock");
    expect(typeRes.items.some((r) => r.id.equals(reminder1.id))).toBe(true);
    expect(typeRes.items.some((r) => r.id.equals(reminder2.id))).toBe(false);

    // Find by status
    const statusRes = await repository.findByStatus("pending");
    expect(statusRes.total).toBeGreaterThanOrEqual(2);
  });

  it("should support deleting a reminder record", async () => {
    const reminder = Reminder.create({
      type: ReminderType.RESTOCK,
      variantId,
      userId,
      contact: ContactType.EMAIL,
      channel: ChannelType.EMAIL
    });
    await repository.save(reminder);

    let retrieved = await repository.findById(reminder.id);
    expect(retrieved).not.toBeNull();

    await repository.delete(reminder.id);

    retrieved = await repository.findById(reminder.id);
    expect(retrieved).toBeNull();
  });
});
