import { DomainEvent } from "./events/domain-event";

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  public get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /** Acknowledge a delivered snapshot, or clear all events when no snapshot is supplied. */
  public clearDomainEvents(deliveredEvents?: readonly DomainEvent[]): void {
    if (!deliveredEvents) {
      this._domainEvents = [];
      return;
    }
    const delivered = new Set(deliveredEvents);
    this._domainEvents = this._domainEvents.filter((event) => !delivered.has(event));
  }
}
