/**
 * Port interfaces for cross-module dependencies.
 * Concrete implementations live in the infra layer;
 * wiring happens in apps/api/src/container.ts.
 */

/** Provides read-only access to Order ownership data from the order-management module. */
export interface IExternalOrderQueryPort {
  findOrderOwner(orderId: string): Promise<{ userId: string | null } | null>;
  /** Owner and status of a checkout, so payments are only created for one's own open checkout. */
  findCheckoutOwner(
    checkoutId: string,
  ): Promise<{ userId: string | null; guestToken: string | null; status: string } | null>;
}

/** Sends refunds to the payment provider that collected the money. */
export interface IPaymentRefundGateway {
  /** Refunds `amount` (major units); throws when the provider refuses. Returns the provider's refund id. */
  refund(params: {
    provider: string;
    providerReference: string;
    amount: number;
    currency: string;
  }): Promise<{ reference: string }>;
}
