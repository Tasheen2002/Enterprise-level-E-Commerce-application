import { DomainEvent, DomainEventHandler, IEventBus } from "./domain-event";

/**
 * Process-local delivery with shared active attempts and up to 10,000 settled histories.
 * Subscribers are captured per attempt. Handlers must not await publication of their own
 * active event (including cyclic dependencies). This is not durable or cross-process delivery.
 */
export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, DomainEventHandler[]> = new Map();
  private deliveries = new Map<string, Set<DomainEventHandler>>();
  private inFlight = new Map<string, Promise<void>>();

  async publish(event: DomainEvent): Promise<void> {
    const id = event.eventId;
    const active = this.inFlight.get(id);
    if (active) return active;

    const handlers = [...(this.subscribers.get(event.eventType) ?? [])];
    const previous = this.deliveries.get(id);
    const delivered = previous ?? new Set<DomainEventHandler>();
    // An already delivered event does not refresh or extend its retention window.
    if (previous && handlers.every((handler) => delivered.has(handler))) return;
    this.deliveries.delete(id);
    // Defer handlers until the in-flight entry exists, including synchronous re-publication.
    const delivery = Promise.resolve()
      .then(async () => {
        for (const handler of handlers) {
          if (delivered.has(handler)) continue;
          await handler.handle(event);
          delivered.add(handler);
        }
      })
      .finally(() => {
        this.inFlight.delete(id);
        this.deliveries.set(id, delivered);
        // Bound settled successes and failures; active deliveries must never be evicted.
        while (this.deliveries.size > 10_000)
          this.deliveries.delete(this.deliveries.keys().next().value!);
      });
    this.inFlight.set(id, delivery);
    return delivery;
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: DomainEventHandler<T>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    if (!this.subscribers.get(eventType)!.includes(handler))
      this.subscribers.get(eventType)!.push(handler);
  }

  unsubscribe(eventType: string, handler: DomainEventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (!handlers) return;
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }
}
