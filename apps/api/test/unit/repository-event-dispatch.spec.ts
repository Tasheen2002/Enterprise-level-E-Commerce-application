import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaRepository } from "../../src/shared/infrastructure/persistence/prisma-repository.base";
import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { InMemoryEventBus } from "../../../../packages/core/src/domain/events/in-memory-event-bus";
import { ReservationRepositoryImpl } from "../../../../modules/cart/infra/persistence/repositories/reservation.repository.impl";
import { Reservation } from "../../../../modules/cart/domain/entities/reservation.entity";

class Event extends DomainEvent {
  get eventType() {
    return "fixture.event";
  }
  getPayload() {
    return {};
  }
}
class Aggregate extends AggregateRoot {
  record(event: DomainEvent) {
    this.addDomainEvent(event);
  }
}
class Repository extends PrismaRepository<Aggregate> {
  dispatch(aggregate: Aggregate) {
    return this.dispatchEvents(aggregate);
  }
}
const event = () => new Event("fixture", "Fixture");
const inertClient = {} as PrismaClient;
describe("repository pending-event dispatch", () => {
  it("keeps the existing no-bus discard behavior", async () => {
    const aggregate = new Aggregate();
    aggregate.record(event());
    await new Repository(inertClient).dispatch(aggregate);
    expect(aggregate.domainEvents).toEqual([]);
  });
  it("does not call the bus for an empty aggregate", async () => {
    const bus = new InMemoryEventBus();
    const publish = vi.spyOn(bus, "publishAll");
    await new Repository(inertClient, bus).dispatch(new Aggregate());
    expect(publish).not.toHaveBeenCalled();
  });
  it("clears a successfully delivered batch", async () => {
    const aggregate = new Aggregate();
    const fixture = event();
    aggregate.record(fixture);
    const bus = new InMemoryEventBus();
    const handler = { eventType: fixture.eventType, handle: vi.fn().mockResolvedValue(undefined) };
    bus.subscribe(fixture.eventType, handler);
    await new Repository(inertClient, bus).dispatch(aggregate);
    expect(handler.handle).toHaveBeenCalledExactlyOnceWith(fixture);
    expect(aggregate.domainEvents).toEqual([]);
  });
  it("retains the batch on failure and retries without repeating successful delivery", async () => {
    const aggregate = new Aggregate();
    const first = event();
    const second = event();
    aggregate.record(first);
    aggregate.record(second);
    const bus = new InMemoryEventBus();
    const failure = new Error("subscriber failure");
    const handler = {
      eventType: first.eventType,
      handle: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(failure)
        .mockResolvedValue(undefined),
    };
    bus.subscribe(first.eventType, handler);
    const repository = new Repository(inertClient, bus);
    await expect(repository.dispatch(aggregate)).rejects.toBe(failure);
    expect(aggregate.domainEvents).toEqual([first, second]);
    await repository.dispatch(aggregate);
    expect(handler.handle.mock.calls.map(([value]) => value)).toEqual([first, second, second]);
    expect(aggregate.domainEvents).toEqual([]);
  });
  it("preserves events added while an earlier batch is being delivered", async () => {
    const aggregate = new Aggregate();
    const first = event();
    const later = event();
    aggregate.record(first);
    const bus = new InMemoryEventBus();
    bus.subscribe(first.eventType, {
      eventType: first.eventType,
      async handle() {
        aggregate.record(later);
      },
    });
    await new Repository(inertClient, bus).dispatch(aggregate);
    expect(aggregate.domainEvents).toEqual([later]);
  });
  it("preserves both existing and new events when a handler appends then fails", async () => {
    const aggregate = new Aggregate();
    const first = event();
    const later = event();
    aggregate.record(first);
    const bus = new InMemoryEventBus();
    const failure = new Error("synthetic failure");
    bus.subscribe(first.eventType, {
      eventType: first.eventType,
      async handle() {
        aggregate.record(later);
        throw failure;
      },
    });
    await expect(new Repository(inertClient, bus).dispatch(aggregate)).rejects.toBe(failure);
    expect(aggregate.domainEvents).toEqual([first, later]);
  });
});

describe("actual reservation repository persistence/dispatch boundary", () => {
  function fixture() {
    const aggregate = Reservation.create({
      cartId: "d3b07384-d113-4956-a5d2-069d30560a6a",
      variantId: "697a8e87-bfa4-42a9-b1bc-001622adf657",
      quantity: 3,
    });
    const upsert = vi.fn().mockResolvedValue({});
    const client = { reservation: { upsert } } as unknown as PrismaClient;
    return { aggregate, upsert, client };
  }
  it("does not dispatch or clear pending events when persistence rejects", async () => {
    const h = fixture();
    const pending = h.aggregate.domainEvents;
    const failure = new Error("synthetic database failure");
    h.upsert.mockRejectedValueOnce(failure);
    const bus = new InMemoryEventBus();
    const publish = vi.spyOn(bus, "publishAll");
    await expect(
      new ReservationRepositoryImpl(h.client, undefined, bus).save(h.aggregate),
    ).rejects.toBe(failure);
    expect(publish).not.toHaveBeenCalled();
    expect(h.aggregate.domainEvents).toEqual(pending);
  });
  it("exposes dispatch failure after persistence has succeeded and retains events for retry", async () => {
    const h = fixture();
    const pending = h.aggregate.domainEvents;
    const failure = new Error("synthetic delivery failure");
    const bus = new InMemoryEventBus();
    let persisted = false;
    h.upsert.mockImplementation(async () => {
      persisted = true;
      return {};
    });
    const handler = {
      eventType: "reservation.created",
      handle: vi
        .fn()
        .mockImplementationOnce(async () => {
          expect(persisted).toBe(true);
          throw failure;
        })
        .mockResolvedValue(undefined),
    };
    bus.subscribe(handler.eventType, handler);
    const repository = new ReservationRepositoryImpl(h.client, undefined, bus);
    await expect(repository.save(h.aggregate)).rejects.toBe(failure);
    expect(persisted).toBe(true);
    expect(h.aggregate.domainEvents).toEqual(pending);
    await repository.save(h.aggregate);
    expect(h.upsert).toHaveBeenCalledTimes(2);
    expect(handler.handle).toHaveBeenCalledTimes(2);
    expect(h.aggregate.domainEvents).toEqual([]);
  });
});
