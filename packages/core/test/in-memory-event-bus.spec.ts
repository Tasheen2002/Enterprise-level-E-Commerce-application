import { describe, expect, it, vi } from "vitest";
import { InMemoryEventBus } from "../src/domain/events/in-memory-event-bus";
import { DomainEvent } from "../src/domain/events/domain-event";

class Event extends DomainEvent {
  get eventType() {
    return "fixture.event";
  }
  getPayload() {
    return {};
  }
}
const event = () => new Event("fixture", "Fixture");
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
const subscriber = () => ({
  eventType: "fixture.event",
  handle: vi.fn().mockResolvedValue(undefined),
});

describe("in-memory event bus delivery", () => {
  it("handles an event with no subscribers and delivers to a later subscriber on republish", async () => {
    const bus = new InMemoryEventBus();
    const fixture = event();
    await bus.publish(fixture);
    const handler = subscriber();
    bus.subscribe(fixture.eventType, handler);
    await bus.publish(fixture);
    expect(handler.handle).toHaveBeenCalledExactlyOnceWith(fixture);
  });
  it("deduplicates subscriptions and successful publication within one bus", async () => {
    const bus = new InMemoryEventBus();
    const handler = subscriber();
    const fixture = event();
    bus.subscribe(fixture.eventType, handler);
    bus.subscribe(fixture.eventType, handler);
    await bus.publish(fixture);
    await bus.publish(fixture);
    expect(handler.handle).toHaveBeenCalledOnce();
  });
  it("keeps different event identities and bus instances independent", async () => {
    const first = new InMemoryEventBus();
    const second = new InMemoryEventBus();
    const handler = subscriber();
    const fixture = event();
    first.subscribe(fixture.eventType, handler);
    second.subscribe(fixture.eventType, handler);
    await Promise.all([first.publish(fixture), second.publish(fixture), first.publish(event())]);
    expect(handler.handle).toHaveBeenCalledTimes(3);
  });
  it("coalesces simultaneous publication until the single delivery finishes", async () => {
    const bus = new InMemoryEventBus();
    const blocked = gate();
    const entered = gate();
    const handler = subscriber();
    handler.handle.mockImplementation(async () => {
      entered.release();
      await blocked.promise;
    });
    const fixture = event();
    bus.subscribe(fixture.eventType, handler);
    const first = bus.publish(fixture);
    await entered.promise;
    const second = bus.publish(fixture);
    blocked.release();
    await Promise.all([first, second]);
    expect(handler.handle).toHaveBeenCalledOnce();
  });
  it("shares a concurrent failure and permits a later retry without repeating successful handlers", async () => {
    const bus = new InMemoryEventBus();
    const blocked = gate();
    const entered = gate();
    const firstHandler = subscriber();
    const failing = subscriber();
    const failure = new Error("synthetic failure");
    failing.handle.mockImplementationOnce(async () => {
      entered.release();
      await blocked.promise;
      throw failure;
    });
    bus.subscribe("fixture.event", firstHandler);
    bus.subscribe("fixture.event", failing);
    const fixture = event();
    const first = bus.publish(fixture);
    await entered.promise;
    const second = bus.publish(fixture);
    const settled = Promise.allSettled([first, second]);
    blocked.release();
    expect(await settled).toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ]);
    await bus.publish(fixture);
    expect(firstHandler.handle).toHaveBeenCalledOnce();
    expect(failing.handle).toHaveBeenCalledTimes(2);
  });
  it("uses the subscription snapshot captured before delivery", async () => {
    const bus = new InMemoryEventBus();
    const entered = gate();
    const blocked = gate();
    const firstHandler = subscriber();
    const removed = subscriber();
    const added = subscriber();
    firstHandler.handle.mockImplementation(async () => {
      entered.release();
      await blocked.promise;
    });
    bus.subscribe("fixture.event", firstHandler);
    bus.subscribe("fixture.event", removed);
    const fixture = event();
    const pending = bus.publish(fixture);
    await entered.promise;
    bus.unsubscribe("fixture.event", removed);
    bus.subscribe("fixture.event", added);
    blocked.release();
    await pending;
    expect(removed.handle).toHaveBeenCalledOnce();
    expect(added.handle).not.toHaveBeenCalled();
    await bus.publish(fixture);
    expect(added.handle).toHaveBeenCalledOnce();
  });
  it("ignores removal of unknown subscriptions and removes a known handler", async () => {
    const bus = new InMemoryEventBus();
    const handler = subscriber();
    bus.unsubscribe("missing", handler);
    bus.subscribe("fixture.event", handler);
    bus.unsubscribe("fixture.event", subscriber());
    bus.unsubscribe("fixture.event", handler);
    await bus.publish(event());
    expect(handler.handle).not.toHaveBeenCalled();
  });
  it("publishes a batch in order and stops at the first failure", async () => {
    const bus = new InMemoryEventBus();
    const handler = subscriber();
    const events = [event(), event(), event()];
    const failure = new Error("batch failure");
    handler.handle.mockResolvedValueOnce(undefined).mockRejectedValueOnce(failure);
    bus.subscribe("fixture.event", handler);
    await expect(bus.publishAll(events)).rejects.toBe(failure);
    expect(handler.handle.mock.calls.map(([value]) => value)).toEqual(events.slice(0, 2));
    await bus.publishAll(events);
    expect(handler.handle.mock.calls.map(([value]) => value)).toEqual([
      events[0],
      events[1],
      events[1],
      events[2],
    ]);
  });
  it("retains 10,000 settled identities and permits redelivery after eviction", async () => {
    const bus = new InMemoryEventBus();
    let calls = 0;
    bus.subscribe("fixture.event", {
      eventType: "fixture.event",
      async handle() {
        calls++;
      },
    });
    const oldest = event();
    const retained = event();
    await bus.publish(oldest);
    await bus.publish(retained);
    for (let i = 0; i < 9_998; i++) await bus.publish(event());
    await bus.publish(oldest);
    expect(calls).toBe(10_000);
    await bus.publish(event());
    await bus.publish(retained);
    expect(calls).toBe(10_001);
    await bus.publish(oldest);
    expect(calls).toBe(10_002);
  });
  it("never evicts active delivery while settled history fills", async () => {
    const bus = new InMemoryEventBus();
    const entered = gate();
    const blocked = gate();
    const pendingEvent = event();
    let pendingCalls = 0;
    bus.subscribe("fixture.event", {
      eventType: "fixture.event",
      async handle(value) {
        if (value === pendingEvent) {
          pendingCalls++;
          entered.release();
          await blocked.promise;
        }
      },
    });
    const first = bus.publish(pendingEvent);
    await entered.promise;
    for (let i = 0; i < 10_001; i++) await bus.publish(event());
    const second = bus.publish(pendingEvent);
    blocked.release();
    await Promise.all([first, second]);
    await bus.publish(pendingEvent);
    expect(pendingCalls).toBe(1);
  });
});
