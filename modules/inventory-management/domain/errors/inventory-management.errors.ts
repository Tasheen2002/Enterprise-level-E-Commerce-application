import { DomainError } from "../../../../packages/core/src/domain/domain-error";
export { EmptyFieldError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, "INVENTORY_VALIDATION_ERROR", 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class StockNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Stock '${identifier}' not found` : "Stock not found",
      "STOCK_NOT_FOUND",
      404,
    );
  }
}

export class LocationNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Location '${identifier}' not found`
        : "Location not found",
      "LOCATION_NOT_FOUND",
      404,
    );
  }
}

export class SupplierNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Supplier '${identifier}' not found`
        : "Supplier not found",
      "SUPPLIER_NOT_FOUND",
      404,
    );
  }
}

export class PurchaseOrderNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Purchase order '${identifier}' not found`
        : "Purchase order not found",
      "PURCHASE_ORDER_NOT_FOUND",
      404,
    );
  }
}

export class PurchaseOrderItemNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Purchase order item '${identifier}' not found`
        : "Purchase order item not found",
      "PURCHASE_ORDER_ITEM_NOT_FOUND",
      404,
    );
  }
}

export class StockAlertNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Stock alert '${identifier}' not found`
        : "Stock alert not found",
      "STOCK_ALERT_NOT_FOUND",
      404,
    );
  }
}

export class PickupReservationNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Pickup reservation '${identifier}' not found`
        : "Pickup reservation not found",
      "PICKUP_RESERVATION_NOT_FOUND",
      404,
    );
  }
}

export class InventoryTransactionNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Inventory transaction '${identifier}' not found`
        : "Inventory transaction not found",
      "INVENTORY_TRANSACTION_NOT_FOUND",
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class LocationAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(
      `Location with name '${name}' already exists`,
      "LOCATION_ALREADY_EXISTS",
      409,
    );
  }
}

export class SupplierAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(
      `Supplier with name '${name}' already exists`,
      "SUPPLIER_ALREADY_EXISTS",
      409,
    );
  }
}

export class StockAlertAlreadyExistsError extends DomainError {
  constructor(variantId: string, type: string) {
    super(
      `Active '${type}' alert already exists for variant '${variantId}'`,
      "STOCK_ALERT_ALREADY_EXISTS",
      409,
    );
  }
}

export class PurchaseOrderItemAlreadyExistsError extends DomainError {
  constructor(variantId: string) {
    super(
      `Item with variant '${variantId}' already exists in this purchase order`,
      "PURCHASE_ORDER_ITEM_ALREADY_EXISTS",
      409,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_OPERATION", 422);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(variantId: string, locationId: string, requested: number, available: number) {
    super(
      `Insufficient stock for variant '${variantId}' at location '${locationId}': requested ${requested}, available ${available}`,
      "INSUFFICIENT_STOCK",
      422,
    );
  }
}

export class PurchaseOrderNotEditableError extends DomainError {
  constructor(status: string) {
    super(
      `Purchase order cannot be edited in '${status}' status`,
      "PURCHASE_ORDER_NOT_EDITABLE",
      422,
    );
  }
}

export class PurchaseOrderNotDeletableError extends DomainError {
  constructor(status: string) {
    super(
      `Only draft purchase orders can be deleted, current status: '${status}'`,
      "PURCHASE_ORDER_NOT_DELETABLE",
      422,
    );
  }
}

export class InvalidPurchaseOrderStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition purchase order from '${from}' to '${to}'`,
      "INVALID_PURCHASE_ORDER_STATUS_TRANSITION",
      422,
    );
  }
}

export class StockAlertAlreadyResolvedError extends DomainError {
  constructor(alertId: string) {
    super(
      `Stock alert '${alertId}' is already resolved`,
      "STOCK_ALERT_ALREADY_RESOLVED",
      422,
    );
  }
}

export class ReservationNotActiveError extends DomainError {
  constructor(reservationId: string, reason: string) {
    super(
      `Reservation '${reservationId}' is not active: ${reason}`,
      "RESERVATION_NOT_ACTIVE",
      422,
    );
  }
}
