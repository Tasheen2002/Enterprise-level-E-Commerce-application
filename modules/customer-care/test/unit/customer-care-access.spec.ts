import { describe, expect, it, vi } from "vitest";
import { SupportTicketService } from "@modules/customer-care/application/services/support-ticket.service";
import { CustomerFeedbackService } from "@modules/customer-care/application/services/customer-feedback.service";
import { TicketSource } from "@modules/customer-care/domain/value-objects";
import { SupportTicket } from "@modules/customer-care/domain/entities/support-ticket.entity";

// Customers may only attach their own orders and tickets; staff may reference
// any. The rule fails closed: anonymous callers and missing lookups refuse.
const ports = (owners: Record<string, string | null>) => ({
  findOrderOwner: vi.fn(async (orderId: string) =>
    orderId in owners ? { userId: owners[orderId] } : null,
  ),
  findOrderItemIds: vi.fn(),
});
const member = { userId: "member", isStaff: false };
const intruder = { userId: "intruder", isStaff: false };
const anonymous = { isStaff: false };
const staff = { userId: "agent", isStaff: true };

describe("support tickets", () => {
  const service = (port = ports({ "order-1": "member", "guest-order": null })) => {
    const repository = { save: vi.fn() };
    return { repository, svc: new SupportTicketService(repository as never, port as never) };
  };
  const ticket = (orderId?: string) => ({ orderId, source: TicketSource.fromString("email"), subject: "Help" });

  it("lets customers reference their own order and staff any order", async () => {
    const { svc } = service();
    await expect(svc.createTicket(ticket("order-1"), member)).resolves.toBeDefined();
    await expect(svc.createTicket(ticket("order-1"), staff)).resolves.toBeDefined();
  });

  it.each([
    ["another customer's order", intruder, "order-1"],
    ["a guest order", member, "guest-order"],
    ["an unknown order", member, "missing"],
    ["any order without signing in", anonymous, "order-1"],
  ])("refuses %s", async (_label, actor, orderId) => {
    const { svc, repository } = service();
    await expect(svc.createTicket(ticket(orderId), actor)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("fails closed when the order lookup is not wired", async () => {
    const repository = { save: vi.fn() };
    const svc = new SupportTicketService(repository as never);
    await expect(svc.createTicket(ticket("order-1"), member)).rejects.toThrow();
  });

  it("still accepts tickets without an order from anyone", async () => {
    const { svc } = service();
    await expect(svc.createTicket(ticket(), anonymous)).resolves.toBeDefined();
  });
});

describe("customer feedback", () => {
  const ownTicket = SupportTicket.create({ userId: "member", source: TicketSource.fromString("chat"), subject: "Late" });
  const ticketId = ownTicket.getTicketId().getValue();
  const service = () => {
    const repository = { save: vi.fn() };
    const tickets = { getTicket: vi.fn(async (id: string) => (id === ticketId ? ownTicket : null)) };
    return {
      repository,
      svc: new CustomerFeedbackService(repository as never, tickets as never, ports({ "order-1": "member" }) as never),
    };
  };

  it("accepts feedback on the customer's own ticket and order", async () => {
    const { svc } = service();
    await expect(svc.createFeedback({ ticketId, orderId: "order-1", csatScore: 5 }, member)).resolves.toBeDefined();
  });

  it.each([
    ["another customer's ticket", { ticketId }, intruder],
    ["a ticket without signing in", { ticketId }, anonymous],
    ["another customer's order", { orderId: "order-1" }, intruder],
  ])("refuses feedback on %s", async (_label, refs, actor) => {
    const { svc, repository } = service();
    await expect(svc.createFeedback({ ...refs, csatScore: 4 }, actor)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
