import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { inspectReminders } from "../../../../scripts/testing/reminder-inspection";

const env = {
  NODE_ENV: "test",
  ALLOW_DATABASE_TEST_CLEANUP: "1",
  ALLOW_OPERATIONAL_DATABASE_WRITES: "1",
  TEST_DATABASE_URL: "postgresql://localhost/inspection_test",
};
function fixture() {
  const client = {
    reminder: { groupBy: vi.fn().mockResolvedValue([]) },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { client, create: vi.fn(() => client as unknown as PrismaClient), report: vi.fn() };
}

describe("canonical reminder aggregate inspection", () => {
  it("reports an empty database without row queries or identity output", async () => {
    const h = fixture();
    await inspectReminders(env, h.create, h.report);
    expect(h.create).toHaveBeenCalledWith(env.TEST_DATABASE_URL);
    expect(h.client.reminder.groupBy).toHaveBeenCalledExactlyOnceWith({
      by: ["type", "status", "channel"],
      _count: { _all: true },
      orderBy: [{ type: "asc" }, { status: "asc" }, { channel: "asc" }],
    });
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-reminders",
      total: 0,
      groups: [],
    });
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("counts every status/type/channel and exposes only enum groups and counts", async () => {
    const h = fixture();
    h.client.reminder.groupBy.mockResolvedValue([
      {
        type: "restock",
        status: "pending",
        channel: "email",
        _count: { _all: 12 },
        users: { email: "synthetic@example.invalid" },
        id: "private-id",
      },
      { type: "restock", status: "sent", channel: "sms", _count: { _all: 3 } },
      { type: "price_drop", status: "unsubscribed", channel: "push", _count: { _all: 1 } },
    ]);
    await inspectReminders(env, h.create, h.report);
    expect(h.report).toHaveBeenCalledExactlyOnceWith({
      scope: "all-reminders",
      total: 16,
      groups: [
        { type: "restock", status: "pending", channel: "email", count: 12 },
        { type: "restock", status: "sent", channel: "sms", count: 3 },
        { type: "price_drop", status: "unsubscribed", channel: "push", count: 1 },
      ],
    });
  });

  it("rejects unsafe settings before constructing a client", async () => {
    const h = fixture();
    await expect(
      inspectReminders({ ...env, NODE_ENV: "production" }, h.create, h.report),
    ).rejects.toThrow();
    expect(h.create).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
  });

  it("rejects aggregate failure without partial output and disconnects", async () => {
    const h = fixture(),
      error = new Error("aggregate failed");
    h.client.reminder.groupBy.mockRejectedValueOnce(error);
    await expect(inspectReminders(env, h.create, h.report)).rejects.toBe(error);
    expect(h.report).not.toHaveBeenCalled();
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects when output fails", async () => {
    const h = fixture();
    h.report.mockImplementation(() => {
      throw new Error("output failed");
    });
    await expect(inspectReminders(env, h.create, h.report)).rejects.toThrow("output failed");
    expect(h.client.$disconnect).toHaveBeenCalledOnce();
  });

  it("preserves aggregate and disconnect failures", async () => {
    const h = fixture(),
      first = new Error("aggregate failed"),
      second = new Error("disconnect failed");
    h.client.reminder.groupBy.mockRejectedValueOnce(first);
    h.client.$disconnect.mockRejectedValueOnce(second);
    await expect(inspectReminders(env, h.create, h.report)).rejects.toMatchObject({
      errors: [first, second],
    });
  });
});
