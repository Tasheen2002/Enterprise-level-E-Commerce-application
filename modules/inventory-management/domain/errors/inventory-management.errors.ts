import { DomainError } from "../../../../packages/core/src/domain/domain-error";
export { EmptyFieldError } from "../../../../packages/core/src/domain/domain-error";

// ─── Validation Errors (400) ─────────────────────────────────────────────────

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

// ─── Not Found Errors (404) ───────────────────────────────────────────────────

export class StockNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier ? `Stock '${identifier}' not found` : "Stock not found",
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
      404,
    );
  }
}

// ─── Conflict Errors (409) ────────────────────────────────────────────────────

export class LocationAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Location with name '${name}' already exists`, 409);
  }
}

export class SupplierAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Supplier with name '${name}' already exists`, 409);
  }
}

export class StockAlertAlreadyExistsError extends DomainError {
  constructor(variantId: string, type: string) {
    super(
      `Active '${type}' alert already exists for variant '${variantId}'`,
      409,
    );
  }
}

export class PurchaseOrderItemAlreadyExistsError extends DomainError {
  constructor(variantId: string) {
    super(
      `Item with variant '${variantId}' already exists in this purchase order`,
      409,
    );
  }
}

// ─── Business Rule Violations (422) ──────────────────────────────────────────

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(variantId: string, locationId: string, requested: number, available: number) {
    super(
      `Insufficient stock for variant '${variantId}' at location '${locationId}': requested ${requested}, available ${available}`,
      422,
    );
  }
}

export class PurchaseOrderNotEditableError extends DomainError {
  constructor(status: string) {
    super(`Purchase order cannot be edited in '${status}' status`, 422);
  }
}

export class PurchaseOrderNotDeletableError extends DomainError {
  constructor(status: string) {
    super(`Only draft purchase orders can be deleted, current status: '${status}'`, 422);
  }
}

export class InvalidStockTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Cannot transition purchase order from '${from}' to '${to}'`, 422);
  }
}

export class StockAlertAlreadyResolvedError extends DomainError {
  constructor(alertId: string) {
    super(`Stock alert '${alertId}' is already resolved`, 422);
  }
}

export class ReservationNotActiveError extends DomainError {
  constructor(reservationId: string, reason: string) {
    super(`Reservation '${reservationId}' is not active: ${reason}`, 422);
  }
}
