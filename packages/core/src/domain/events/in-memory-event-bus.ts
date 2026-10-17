import { DomainEvent, DomainEventHandler, IEventBus } from "./domain-event";

export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, DomainEventHandler[]> = new Map();
  private deliveries = new Map<string, Set<DomainEventHandler>>();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.subscribers.get(event.eventType) ?? [];
    const delivered = this.deliveries.get(event.eventId) ?? new Set<DomainEventHandler>();
    this.deliveries.set(event.eventId, delivered);
    // Bound failed deliveries too, since a handler can throw below.
    while (this.deliveries.size > 10_000)
      this.deliveries.delete(this.deliveries.keys().next().value!);
    for (const handler of handlers) {
      if (delivered.has(handler)) continue;
      await handler.handle(event);
      delivered.add(handler);
    }
    // Bounded in-process deduplication; persistence/durable queues belong to adapters.
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
