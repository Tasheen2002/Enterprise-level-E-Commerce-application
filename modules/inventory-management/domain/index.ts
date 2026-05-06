// ─── Errors ──────────────────────────────────────────────────────────────
export {
  EmptyFieldError,
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
  InvalidPurchaseOrderStatusTransitionError,
  StockAlertAlreadyResolvedError,
  ReservationNotActiveError,
} from "./errors";

// ─── Value Objects (IDs, enums, single-value, composite) ────────────────
export {
  // ID VOs
  StockId,
  LocationId,
  SupplierId,
  PurchaseOrderId,
  AlertId,
  ReservationId,
  TransactionId,
  // Enum VOs (TS enum + wrapper class)
  LocationType,
  LocationTypeVO,
  TransactionReason,
  TransactionReasonVO,
  AlertType,
  AlertTypeVO,
  PurchaseOrderStatus,
  PurchaseOrderStatusVO,
  ReservationStatus,
  ReservationStatusVO,
  // Pattern B
  SupplierName,
  LocationName,
  // Pattern C
  SupplierContact,
  LocationAddress,
  // Complex
  StockLevel,
} from "./value-objects";
export type {
  // Composite-VO data shapes (kept exported for entity DTO reuse)
  StockIdData,
  SupplierContactData,
  SupplierContactProps,
  LocationAddressData,
  LocationAddressProps,
} from "./value-objects";

// ─── Entities ────────────────────────────────────────────────────────────
export {
  Stock,
  StockDTO,
  InventoryTransaction,
  InventoryTransactionDTO,
  StockAlert,
  StockAlertDTO,
  Location,
  LocationDTO,
  Supplier,
  SupplierDTO,
  PurchaseOrder,
  PurchaseOrderDTO,
  PurchaseOrderItem,
  PurchaseOrderItemDTO,
  PickupReservation,
  PickupReservationDTO,
} from "./entities";

// ─── Repository interfaces ───────────────────────────────────────────────
export {
  IStockRepository,
  IInventoryTransactionRepository,
  IStockAlertRepository,
  ILocationRepository,
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseOrderItemRepository,
  IPickupReservationRepository,
} from "./repositories";

// ─── Constants ───────────────────────────────────────────────────────────
export * from "./constants";
