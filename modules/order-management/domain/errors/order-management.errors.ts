import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class OrderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Order '${identifier}' not found` : "Order not found",
      404,
    );
  }
}

export class OrderItemNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Order item '${identifier}' not found`
        : "Order item not found",
      404,
    );
  }
}

export class OrderAddressNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Order address for order '${identifier}' not found`
        : "Order address not found",
      404,
    );
  }
}

export class OrderShipmentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Shipment '${identifier}' not found`
        : "Order shipment not found",
      404,
    );
  }
}

export class OrderStatusHistoryNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Status history entry '${identifier}' not found`
        : "Order status history not found",
      404,
    );
  }
}

export class OrderEventNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Order event '${identifier}' not found`
        : "Order event not found",
      404,
    );
  }
}

export class BackorderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Backorder for item '${identifier}' not found`
        : "Backorder not found",
      404,
    );
  }
}

export class PreorderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Preorder for item '${identifier}' not found`
        : "Preorder not found",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class BackorderAlreadyExistsError extends DomainError {
  constructor(orderItemId: string) {
    super(`Backorder already exists for order item '${orderItemId}'`, 409);
  }
}

export class PreorderAlreadyExistsError extends DomainError {
  constructor(orderItemId: string) {
    super(`Preorder already exists for order item '${orderItemId}'`, 409);
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition order from '${from}' to '${to}'`, 422);
  }
}

export class OrderNotEditableError extends DomainError {
  constructor(status: string) {
    super(`Order cannot be edited in '${status}' status`, 422);
  }
}

export class OrderCancellationError extends DomainError {
  constructor(reason: string) {
    super(`Cannot cancel order: ${reason}`, 422);
  }
}

export class OrderRefundError extends DomainError {
  constructor(reason: string) {
    super(`Cannot refund order: ${reason}`, 422);
  }
}

export class ShipmentAlreadyShippedError extends DomainError {
  constructor(shipmentId: string) {
    super(`Shipment '${shipmentId}' is already marked as shipped`, 422);
  }
}

export class ShipmentAlreadyDeliveredError extends DomainError {
  constructor(shipmentId: string) {
    super(`Shipment '${shipmentId}' is already marked as delivered`, 422);
  }
}

export class OrderAddressRequiredError extends DomainError {
  constructor() {
    super("Order must have a shipping address before payment", 422);
  }
}
