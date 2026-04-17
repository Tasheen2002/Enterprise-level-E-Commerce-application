// ── Public API for the order-management module ───────────────────────────────
//
// Other modules must import from this path only.
// Internal paths (domain/, application/, infra/) are not part of the public API.

// ── Domain errors ─────────────────────────────────────────────────────────────
export {
  DomainValidationError,
  OrderNotFoundError,
  OrderItemNotFoundError,
  OrderAddressNotFoundError,
  OrderShipmentNotFoundError,
  OrderStatusHistoryNotFoundError,
  OrderEventNotFoundError,
  BackorderNotFoundError,
  PreorderNotFoundError,
  BackorderAlreadyExistsError,
  PreorderAlreadyExistsError,
  InvalidOperationError,
  InvalidOrderStatusTransitionError,
  OrderNotEditableError,
  OrderCancellationError,
  OrderRefundError,
  ShipmentAlreadyShippedError,
  ShipmentAlreadyDeliveredError,
  OrderAddressRequiredError,
} from "./domain/errors/order-management.errors";

// ── Domain enums ──────────────────────────────────────────────────────────────
export { OrderStatusEnum, OrderSourceEnum } from "./domain/enums/order.enums";

// ── Domain value objects ──────────────────────────────────────────────────────
export { OrderId } from "./domain/value-objects/order-id.vo";

// ── External service interfaces ───────────────────────────────────────────────
export type {
  IExternalVariantService,
  IExternalProductService,
  IExternalProductMediaService,
  IExternalStockService,
  ExternalVariantData,
  ExternalProductData,
  ExternalMediaAsset,
  ExternalStockData,
} from "./domain/external-services";

// ── Application layer ─────────────────────────────────────────────────────────
export * from "./application";
