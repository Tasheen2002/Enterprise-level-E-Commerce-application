/**
 * Port interfaces for cross-module dependencies.
 * Concrete implementations live in the infra layer;
 * wiring happens in apps/api/src/container.ts.
 */

/** Provides read-only access to Order ownership data from the order-management module. */
export interface IExternalOrderQueryPort {
  findOrderOwner(orderId: string): Promise<{ userId: string | null } | null>;
}
