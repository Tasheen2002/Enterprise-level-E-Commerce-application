// ID Value Objects
export { StockId } from "./stock-id.vo";
export { LocationId } from "./location-id.vo";
export { SupplierId } from "./supplier-id.vo";
export { PurchaseOrderId } from "./purchase-order-id.vo";
export { AlertId } from "./alert-id.vo";
export { ReservationId } from "./reservation-id.vo";
export { TransactionId } from "./transaction-id.vo";

// Enum Value Objects
export { LocationType, LocationTypeVO } from "./location-type.vo";
export { TransactionReason, TransactionReasonVO } from "./transaction-reason.vo";
export { AlertType, AlertTypeVO } from "./alert-type.vo";
export {
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
} from "./purchase-order-status.vo";
export { ReservationStatus, ReservationStatusVO } from "./reservation-status.vo";

// String Value Objects
export { SupplierName } from "./supplier-name.vo";

// Composite / Struct Value Objects
export { SupplierContact } from "./supplier-contact.vo";
export type { SupplierContactProps } from "./supplier-contact.vo";
export { LocationAddress } from "./location-address.vo";
export type { LocationAddressProps } from "./location-address.vo";

// Complex Value Objects
export { StockLevel } from "./stock-level.vo";
