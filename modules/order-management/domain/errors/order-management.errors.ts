import { DomainError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class OrderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Order '${identifier}' not found` : "Order not found",
      "ORDER_NOT_FOUND",
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
      "ORDER_ITEM_NOT_FOUND",
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
      "ORDER_ADDRESS_NOT_FOUND",
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
      "ORDER_SHIPMENT_NOT_FOUND",
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
      "ORDER_STATUS_HISTORY_NOT_FOUND",
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
      "ORDER_EVENT_NOT_FOUND",
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
      "BACKORDER_NOT_FOUND",
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
      "PREORDER_NOT_FOUND",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class BackorderAlreadyExistsError extends DomainError {
  constructor(orderItemId: string) {
    super(
      `Backorder already exists for order item '${orderItemId}'`,
      "BACKORDER_ALREADY_EXISTS",
      409,
    );
  }
}

export class PreorderAlreadyExistsError extends DomainError {
  constructor(orderItemId: string) {
    super(
      `Preorder already exists for order item '${orderItemId}'`,
      "PREORDER_ALREADY_EXISTS",
      409,
    );
  }
}

// ─── Authorization Errors (403) ──────────────────────────────────────────────
export class ContactMismatchError extends DomainError {
  constructor() {
    super(
      "The email or phone number does not match our records for this order",
      "ORDER_CONTACT_MISMATCH",
      403,
    );
  }
}

export class OrderAccessDeniedError extends DomainError {
  constructor() {
    super(
      "You do not have permission to access this order",
      "ORDER_ACCESS_DENIED",
      403,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_OPERATION", 422);
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition order from '${from}' to '${to}'`,
      "INVALID_ORDER_STATUS_TRANSITION",
      422,
    );
  }
}

export class OrderNotEditableError extends DomainError {
  constructor(status: string) {
    super(
      `Order cannot be edited in '${status}' status`,
      "ORDER_NOT_EDITABLE",
      422,
    );
  }
}

export class OrderCancellationError extends DomainError {
  constructor(reason: string) {
    super(`Cannot cancel order: ${reason}`, "ORDER_CANCELLATION_FAILED", 422);
  }
}

export class OrderRefundError extends DomainError {
  constructor(reason: string) {
    super(`Cannot refund order: ${reason}`, "ORDER_REFUND_FAILED", 422);
  }
}

export class ShipmentAlreadyShippedError extends DomainError {
  constructor(shipmentId: string) {
    super(
      `Shipment '${shipmentId}' is already marked as shipped`,
      "SHIPMENT_ALREADY_SHIPPED",
      422,
    );
  }
}

export class ShipmentAlreadyDeliveredError extends DomainError {
  constructor(shipmentId: string) {
    super(
      `Shipment '${shipmentId}' is already marked as delivered`,
      "SHIPMENT_ALREADY_DELIVERED",
      422,
    );
  }
}

export class OrderAddressRequiredError extends DomainError {
  constructor() {
    super(
      "Order must have a shipping address before payment",
      "ORDER_ADDRESS_REQUIRED",
      422,
    );
  }
}
