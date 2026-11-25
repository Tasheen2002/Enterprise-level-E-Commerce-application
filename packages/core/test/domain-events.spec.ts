import { afterEach, describe, expect, it, vi } from "vitest";
import { AggregateRoot } from "../src/domain/aggregate-root";
import { DomainEvent } from "../src/domain/events/domain-event";

class FixtureEvent extends DomainEvent {
  get eventType(): string {
    return "fixture.changed";
  }
  getPayload(): Record<string, unknown> {
    return { quantity: 2, nested: { reason: "fixture" } };
  }
}
class FixtureAggregate extends AggregateRoot {
  record(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}
const event = () => new FixtureEvent("synthetic-aggregate", "Fixture");
afterEach(() => vi.useRealTimers());

describe("aggregate pending event contract", () => {
  it("starts without pending events", () => {
    expect(new FixtureAggregate().domainEvents).toEqual([]);
  });
  it("preserves recorded event identity and order", () => {
    const aggregate = new FixtureAggregate();
    const first = event();
    const second = event();
    aggregate.record(first);
    aggregate.record(second);
    expect(aggregate.domainEvents).toEqual([first, second]);
    expect(aggregate.domainEvents[0]).toBe(first);
  });
  it("protects the pending queue from mutations to a returned array", () => {
    const aggregate = new FixtureAggregate();
    const original = event();
    aggregate.record(original);
    const snapshot = aggregate.domainEvents;
    snapshot.pop();
    snapshot.push(event());
    expect(aggregate.domainEvents).toEqual([original]);
  });
  it("clears pending work without changing an already captured delivery batch", () => {
    const aggregate = new FixtureAggregate();
    const original = event();
    aggregate.record(original);
    const batch = aggregate.domainEvents;
    aggregate.clearDomainEvents();
    expect(aggregate.domainEvents).toEqual([]);
    expect(batch).toEqual([original]);
    const next = event();
    aggregate.record(next);
    expect(aggregate.domainEvents).toEqual([next]);
    aggregate.clearDomainEvents();
    aggregate.clearDomainEvents();
    expect(aggregate.domainEvents).toEqual([]);
  });
  it("isolates event queues across aggregate instances", () => {
    const first = new FixtureAggregate();
    const second = new FixtureAggregate();
    first.record(event());
    expect(second.domainEvents).toEqual([]);
    second.clearDomainEvents();
    expect(first.domainEvents).toHaveLength(1);
  });
  it("acknowledges only the supplied event snapshot", () => {
    const aggregate = new FixtureAggregate();
    const first = event();
    const later = event();
    aggregate.record(first);
    aggregate.record(later);
    aggregate.clearDomainEvents([]);
    aggregate.clearDomainEvents([event()]);
    expect(aggregate.domainEvents).toEqual([first, later]);
    aggregate.clearDomainEvents([first]);
    expect(aggregate.domainEvents).toEqual([later]);
  });
});

describe("domain event envelope contract", () => {
  it("assigns distinct UUID identities and captures occurrence time at creation", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-02T03:04:05.000Z");
    vi.setSystemTime(now);
    const first = event();
    const second = event();
    expect(first.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(second.eventId).not.toBe(first.eventId);
    vi.setSystemTime(new Date("2026-01-03T00:00:00.000Z"));
    expect(first.occurredAt).toEqual(now);
  });
  it("serializes stable event identity, aggregate metadata, ISO time and payload", () => {
    const fixture = event();
    const expected = {
      eventId: fixture.eventId,
      eventType: "fixture.changed",
      occurredAt: fixture.occurredAt.toISOString(),
      aggregateId: "synthetic-aggregate",
      aggregateType: "Fixture",
      payload: { quantity: 2, nested: { reason: "fixture" } },
    };
    expect(fixture.toJSON()).toEqual(expected);
    expect(JSON.parse(JSON.stringify(fixture))).toEqual(expected);
    expect(fixture.toJSON()).toEqual(expected);
  });
});
