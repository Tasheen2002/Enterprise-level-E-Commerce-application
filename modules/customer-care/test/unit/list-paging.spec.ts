import { describe, expect, it, vi } from "vitest";
import { pageOf } from "@modules/customer-care/application/queries/paging";
import { ListSupportTicketsHandler } from "@modules/customer-care/application/queries/list-support-tickets.query";

// Listings used to load every row of a table; they are now always paged.
describe("customer care listings", () => {
  it.each([
    [{}, { limit: 50, offset: 0 }],
    [{ limit: 10, offset: 20 }, { limit: 10, offset: 20 }],
    [{ limit: 5000 }, { limit: 100, offset: 0 }],
    [{ limit: 0, offset: -3 }, { limit: 50, offset: 0 }],
    [{ limit: Number.NaN }, { limit: 50, offset: 0 }],
  ])("bounds %j to %j", (query, expected) => {
    expect(pageOf(query)).toEqual(expected);
  });

  it("passes the bounded page to the service", async () => {
    const service = { getAllTickets: vi.fn(async () => []) };
    await new ListSupportTicketsHandler(service as never).handle({ limit: 1000 });
    expect(service.getAllTickets).toHaveBeenCalledWith({ limit: 100, offset: 0 });
  });
});
