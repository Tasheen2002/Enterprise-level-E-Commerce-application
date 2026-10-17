import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { StockAddedEvent } from "../../../../modules/inventory-management/domain/entities/stock.entity";
import {
  runRestockDispatcherProbe,
  runRestockReminderProbe,
} from "../../../../scripts/testing/restock-probes";

function database() {
  const model = () => ({
    create: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    findUnique: vi.fn().mockResolvedValue(null),
  });
  const tx = {
    product: model(),
    productVariant: model(),
    user: model(),
    location: model(),
    reminder: { ...model(), count: vi.fn().mockResolvedValue(1) },
  };
  tx.reminder.findUnique.mockResolvedValue({ status: "pending", optInAt: new Date() });
  const root = {
    ...tx,
    product: model(),
    reminder: model(),
    $transaction: vi.fn(async (action: (client: typeof tx) => Promise<unknown>) => action(tx)),
  };
  return { tx, root, prisma: root as unknown as PrismaClient };
}

describe("isolated restock operational probes", () => {
  it("rolls reminder fixtures back and verifies they are absent", async () => {
    const { prisma, root, tx } = database();
    await runRestockReminderProbe(prisma);
    expect(root.$transaction).toHaveBeenCalledOnce();
    const created = tx.reminder.create.mock.calls[0][0].data;
    expect(created).toMatchObject({ type: "restock", status: "pending", channel: "email" });
    expect(root.reminder.findUnique).toHaveBeenCalledWith({ where: { id: created.id } });
    expect(tx.productVariant.create.mock.calls[0][0].data.productId).toBe(
      tx.product.create.mock.calls[0][0].data.id,
    );
    expect(tx.user.create.mock.calls[0][0].data.email).toMatch(/@example\.invalid$/);
    expect(tx.productVariant.create.mock.calls[0][0].data.sku).toMatch(/^[A-Z0-9-]+$/);
  });

  it("propagates insert failures instead of treating them as expected rollback", async () => {
    const { prisma, tx } = database();
    const failure = new Error("insert failed");
    tx.reminder.create.mockRejectedValue(failure);
    await expect(runRestockReminderProbe(prisma)).rejects.toBe(failure);
  });

  it.each([null, { status: "sent", optInAt: new Date() }, { status: "pending", optInAt: null }])(
    "rejects invalid persisted reminder state",
    async (record) => {
      const { prisma, tx } = database();
      tx.reminder.findUnique.mockResolvedValue(record);
      await expect(runRestockReminderProbe(prisma)).rejects.toThrow("persistence assertion");
    },
  );

  it("rejects an incorrect isolated count", async () => {
    const { prisma, tx } = database();
    tx.reminder.count.mockResolvedValue(2);
    await expect(runRestockReminderProbe(prisma)).rejects.toThrow("persistence assertion");
  });

  it("rejects rollback that leaves a fixture", async () => {
    const { prisma, root } = database();
    root.reminder.findUnique.mockResolvedValue({ id: "leftover" });
    await expect(runRestockReminderProbe(prisma)).rejects.toThrow("left fixture records");
  });

  it("rejects rollback that leaves a product", async () => {
    const { prisma, root } = database();
    root.product.findUnique.mockResolvedValue({ id: "leftover" });
    await expect(runRestockReminderProbe(prisma)).rejects.toThrow("left fixture records");
  });

  it("attempts scoped cleanup when fixture insertion fails", async () => {
    const { prisma, tx } = database();
    tx.reminder.create.mockRejectedValue(new Error("fixture failed"));
    const publish = vi.fn();
    await expect(runRestockDispatcherProbe(prisma, publish)).rejects.toThrow("fixture failed");
    expect(publish).not.toHaveBeenCalled();
    expect(tx.reminder.deleteMany).toHaveBeenCalledOnce();
  });

  it("awaits the subscriber and removes only its own fixtures", async () => {
    const { prisma, root, tx } = database();
    const publish = vi.fn(async (_event: StockAddedEvent) => {
      await Promise.resolve();
      root.reminder.findUnique.mockResolvedValue({ status: "sent" });
    });
    await runRestockDispatcherProbe(prisma, publish);
    const reminder = tx.reminder.create.mock.calls[0][0].data;
    expect(publish).toHaveBeenCalledOnce();
    expect(publish.mock.calls[0][0].getPayload()).toMatchObject({
      variantId: reminder.variantId,
      quantity: 5,
    });
    expect(tx.reminder.deleteMany).toHaveBeenCalledWith({ where: { id: reminder.id } });
    expect(tx.product.deleteMany).toHaveBeenCalledWith({
      where: { id: tx.product.create.mock.calls[0][0].data.id },
    });
  });

  it("cleans fixtures when publishing fails", async () => {
    const { prisma, tx } = database();
    const failure = new Error("subscriber failed");
    await expect(
      runRestockDispatcherProbe(prisma, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(tx.reminder.deleteMany).toHaveBeenCalledOnce();
    expect(tx.user.deleteMany).toHaveBeenCalledOnce();
    expect(tx.product.deleteMany).toHaveBeenCalledOnce();
    expect(tx.location.deleteMany).toHaveBeenCalledOnce();
  });

  it("cleans fixtures when the subscriber leaves the reminder pending", async () => {
    const { prisma, tx } = database();
    await expect(runRestockDispatcherProbe(prisma, async () => {})).rejects.toThrow(
      "state transition failed",
    );
    expect(tx.reminder.deleteMany).toHaveBeenCalledOnce();
  });

  it("reports cleanup failures", async () => {
    const { prisma, root, tx } = database();
    root.reminder.findUnique.mockResolvedValue({ status: "sent" });
    tx.reminder.deleteMany.mockRejectedValue(new Error("cleanup failed"));
    await expect(runRestockDispatcherProbe(prisma, async () => {})).rejects.toThrow(
      "cleanup failed",
    );
  });

  it("preserves both subscriber and cleanup failures", async () => {
    const { prisma, tx } = database();
    const dispatchFailure = new Error("subscriber failed");
    const cleanupFailure = new Error("cleanup failed");
    tx.reminder.deleteMany.mockRejectedValue(cleanupFailure);
    try {
      await runRestockDispatcherProbe(prisma, async () => {
        throw dispatchFailure;
      });
      expect.fail("Expected both failures");
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).errors).toEqual([dispatchFailure, cleanupFailure]);
    }
  });
});
