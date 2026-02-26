// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Stock ────────────────────────────────────────────────────────────────────
export const STOCK_MIN_QUANTITY = 0;
export const STOCK_MAX_QUANTITY = 1_000_000;
export const STOCK_DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const STOCK_DEFAULT_SAFETY_STOCK = 5;

// ─── Location ─────────────────────────────────────────────────────────────────
export const LOCATION_NAME_MIN_LENGTH = 1;
export const LOCATION_NAME_MAX_LENGTH = 255;
export const VALID_LOCATION_TYPES = ["warehouse", "store", "vendor"] as const;

// ─── Supplier ─────────────────────────────────────────────────────────────────
export const SUPPLIER_NAME_MIN_LENGTH = 1;
export const SUPPLIER_NAME_MAX_LENGTH = 255;
export const SUPPLIER_LEAD_TIME_MIN_DAYS = 0;
export const SUPPLIER_LEAD_TIME_MAX_DAYS = 365;
export const SUPPLIER_MAX_CONTACTS = 20;

// ─── Purchase Order ───────────────────────────────────────────────────────────
export const PO_ITEM_MIN_QTY = 1;
export const PO_ITEM_MAX_QTY = 10_000;
export const PO_MAX_ITEMS = 100;
export const VALID_PO_STATUSES = [
  "draft",
  "sent",
  "part_received",
  "received",
  "cancelled",
] as const;

// ─── Stock Alert ──────────────────────────────────────────────────────────────
export const VALID_ALERT_TYPES = ["low_stock", "oos", "overstock"] as const;

// ─── Pickup Reservation ───────────────────────────────────────────────────────
export const RESERVATION_DEFAULT_EXPIRY_MINUTES = 30;
export const RESERVATION_MIN_EXPIRY_MINUTES = 1;
export const RESERVATION_MAX_EXPIRY_MINUTES = 1440; // 24 hours
export const RESERVATION_MIN_QTY = 1;

// ─── Transaction Reason ───────────────────────────────────────────────────────
export const TRANSACTION_REASON_MIN_LENGTH = 2;
export const TRANSACTION_REASON_MAX_LENGTH = 64;
export const VALID_TRANSACTION_REASONS = [
  "return",
  "adjustment",
  "po",
  "order",
  "damage",
  "theft",
] as const;
