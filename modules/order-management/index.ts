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
  ContactMismatchError,
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
