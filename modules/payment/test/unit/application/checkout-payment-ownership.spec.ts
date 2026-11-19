import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PaymentService } from "../../../application/services/payment.service";

// A checkout's payment may only be created by that checkout's owner while it
// is open; otherwise anyone knowing the id could replace the real buyer's
// payment and block their order.
function harness(
  owner: { userId: string | null; guestToken: string | null; status: string } | null,
) {
  const intents = {
    findByCheckoutId: vi.fn(async () => null),
    findByIdempotencyKey: vi.fn(async () => null),
    save: vi.fn(),
  };
  const service = new PaymentService(
    {
      findOrderOwner: vi.fn(),
      findCheckoutOwner: vi.fn(async () => owner),
    } as never,
    intents as never,
    { save: vi.fn() } as never,
  );
  return { service, intents };
}
const create = (service: PaymentService, identity: { userId?: string; guestToken?: string }) =>
  service.createPaymentIntent({
    checkoutId: randomUUID(),
    provider: "stripe",
    amount: 50,
    currency: "usd",
    ...identity,
  });

describe("checkout payment creation", () => {
  it("lets the signed-in owner create the payment", async () => {
    const h = harness({ userId: "member", guestToken: null, status: "pending" });
    await expect(create(h.service, { userId: "member" })).resolves.toBeDefined();
  });

  it("lets a guest create the payment with their guest token", async () => {
    const h = harness({ userId: null, guestToken: "guest-abc", status: "pending" });
    await expect(create(h.service, { guestToken: "guest-abc" })).resolves.toBeDefined();
  });

  it.each([
    ["another customer", { userId: "intruder" }],
    ["an anonymous caller", {}],
    ["a different guest token", { guestToken: "guest-other" }],
  ])("refuses %s for a customer's checkout", async (_label, identity) => {
    const h = harness({ userId: "member", guestToken: null, status: "pending" });
    await expect(create(h.service, identity)).rejects.toThrow("do not own this checkout");
    expect(h.intents.save).not.toHaveBeenCalled();
  });

  it("refuses anonymous callers for a guest's checkout without its token", async () => {
    const h = harness({ userId: null, guestToken: "guest-abc", status: "pending" });
    await expect(create(h.service, {})).rejects.toThrow("do not own this checkout");
  });

  it("refuses payments for checkouts that are no longer open", async () => {
    const h = harness({ userId: "member", guestToken: null, status: "completed" });
    await expect(create(h.service, { userId: "member" })).rejects.toThrow("no longer open");
  });
});
