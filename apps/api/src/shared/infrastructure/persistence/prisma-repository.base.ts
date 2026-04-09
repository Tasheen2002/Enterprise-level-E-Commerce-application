import { PrismaClient } from '@prisma/client';
import { AggregateRoot } from '../../../../../../packages/core/src/domain/aggregate-root';
import { IEventBus } from '../../../../../../packages/core/src/domain/events/domain-event';

/**
 * Base class for all Prisma repository implementations.
 * Provides domain event dispatching after persistence operations.
 */
export abstract class PrismaRepository<T extends AggregateRoot> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly eventBus?: IEventBus
  ) {}

  /**
   * Dispatch and clear domain events from an aggregate root.
   * Call this after successful persistence operations (save, update).
   */
  protected async dispatchEvents(aggregate: T): Promise<void> {
    if (!this.eventBus) return;

    const events = aggregate.domainEvents;
    if (events.length === 0) return;

    await this.eventBus.publishAll(events);
    aggregate.clearDomainEvents();
  }
}
