// ID Value Objects (Pattern A — UUID-backed, single field, extends UuidId base)
export { LocationId } from "./location-id.vo";
export { SupplierId } from "./supplier-id.vo";
export { PurchaseOrderId } from "./purchase-order-id.vo";
export { AlertId } from "./alert-id.vo";
export { ReservationId } from "./reservation-id.vo";
export { TransactionId } from "./transaction-id.vo";

// Enum Value Objects (TS enum + VO wrapper)
export { LocationType, LocationTypeVO } from "./location-type.vo";
export { TransactionReason, TransactionReasonVO } from "./transaction-reason.vo";
export { AlertType, AlertTypeVO } from "./alert-type.vo";
export {
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
} from "./purchase-order-status.vo";
export { ReservationStatus, ReservationStatusVO } from "./reservation-status.vo";

// Single-Value (Pattern B) Value Objects
export { SupplierName } from "./supplier-name.vo";
export { LocationName } from "./location-name.vo";
export { StockId } from "./stock-id.vo";
export type { StockIdData } from "./stock-id.vo";
export { SupplierContact } from "./supplier-contact.vo";
export type {
  SupplierContactData,
  SupplierContactProps,
} from "./supplier-contact.vo";
export { LocationAddress } from "./location-address.vo";
export type {
  LocationAddressData,
  LocationAddressProps,
} from "./location-address.vo";

// Complex (multi-value with derived fields) Value Object
export { StockLevel } from "./stock-level.vo";
