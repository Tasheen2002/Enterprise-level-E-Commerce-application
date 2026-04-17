/**
 * Port interfaces for cross-module dependencies.
 * Concrete implementations live in the infra layer;
 * wiring happens in apps/api/src/container.ts.
 */

/** Provides read-only order data needed by the customer-care module. */
export interface IExternalOrderQueryPort {
  findOrderOwner(orderId: string): Promise<{ userId: string | null } | null>;
  findOrderItemIds(orderId: string): Promise<string[] | null>;
}
