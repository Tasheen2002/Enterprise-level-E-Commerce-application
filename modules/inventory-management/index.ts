/**
 * Inventory Management Module — Public API
 *
 * All cross-module imports MUST go through this barrel.
 * Never import directly from internal module paths.
 */

// ─── Domain Errors ────────────────────────────────────────────────────────────
export {
  DomainValidationError,
  StockNotFoundError,
  LocationNotFoundError,
  SupplierNotFoundError,
  PurchaseOrderNotFoundError,
  PurchaseOrderItemNotFoundError,
  StockAlertNotFoundError,
  PickupReservationNotFoundError,
  InventoryTransactionNotFoundError,
  LocationAlreadyExistsError,
  SupplierAlreadyExistsError,
  StockAlertAlreadyExistsError,
  PurchaseOrderItemAlreadyExistsError,
  InvalidOperationError,
  InsufficientStockError,
  PurchaseOrderNotEditableError,
  PurchaseOrderNotDeletableError,
  InvalidStockTransitionError,
  StockAlertAlreadyResolvedError,
  ReservationNotActiveError,
} from "./domain/errors";

// ─── Domain Enums ─────────────────────────────────────────────────────────────
export { AlertType } from "./domain/value-objects/alert-type.vo";
export { LocationType } from "./domain/value-objects/location-type.vo";
export { PurchaseOrderStatus } from "./domain/value-objects/purchase-order-status.vo";
export { ReservationStatus } from "./domain/value-objects/reservation-status.vo";
export { TransactionReason } from "./domain/value-objects/transaction-reason.vo";

// ─── Identity Value Objects ───────────────────────────────────────────────────
export { StockId } from "./domain/value-objects/stock-id.vo";
export { LocationId } from "./domain/value-objects/location-id.vo";
export { SupplierId } from "./domain/value-objects/supplier-id.vo";
export { PurchaseOrderId } from "./domain/value-objects/purchase-order-id.vo";
export { AlertId } from "./domain/value-objects/alert-id.vo";
export { ReservationId } from "./domain/value-objects/reservation-id.vo";
export { TransactionId } from "./domain/value-objects/transaction-id.vo";

// ─── Application Layer (Commands, Queries, Handlers) ─────────────────────────
export * from "./application";
