export interface OrderLineAllocation {
  /** Quantity ordered on this order item. */
  orderedQty: number;
  /** Quantity already placed in other shipments that have not failed. */
  allocatedQty: number;
}

/**
 * What a shipment may contain: the order's own items, never more than was
 * ordered across all its (non-failed) shipments.
 */
export interface IShipmentAllocationPort {
  /** The order's items keyed by order item id, or null when the order does not exist. */
  getOrderLines(
    orderId: string,
    excludeShipmentId?: string,
  ): Promise<Map<string, OrderLineAllocation> | null>;
}
