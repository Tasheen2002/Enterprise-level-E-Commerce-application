import { DomainEvent, DomainEventHandler, IEventBus } from './domain-event';


export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, DomainEventHandler[]> = new Map();


  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.subscribers.get(event.eventType) ?? [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }


  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }


  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>,
  ): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }


  unsubscribe(eventType: string, handler: DomainEventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (!handlers) return;
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }
}
