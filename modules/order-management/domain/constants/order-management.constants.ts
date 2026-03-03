// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Order Item ───────────────────────────────────────────────────────────────
export const ORDER_ITEM_MIN_QUANTITY = 1;
export const ORDER_ITEM_MAX_QUANTITY = 999;
export const ORDER_ITEM_GIFT_MESSAGE_MAX_LENGTH = 500;

// ─── Order Number ─────────────────────────────────────────────────────────────
export const ORDER_NUMBER_MAX_LENGTH = 50;
export const ORDER_NUMBER_DEFAULT_PREFIX = "ORD";

// ─── Order Status ─────────────────────────────────────────────────────────────
export const VALID_ORDER_STATUSES = [
  "created",
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "fulfilled",
  "partially_returned",
  "refunded",
  "cancelled",
] as const;

// ─── Order Source ─────────────────────────────────────────────────────────────
export const VALID_ORDER_SOURCES = ["web", "mobile"] as const;

// ─── Currency ─────────────────────────────────────────────────────────────────
export const ORDER_CURRENCY_CODE_LENGTH = 3;

// ─── Address Snapshot ─────────────────────────────────────────────────────────
export const ADDRESS_FIRST_NAME_MAX_LENGTH = 100;
export const ADDRESS_LAST_NAME_MAX_LENGTH = 100;
export const ADDRESS_LINE_MAX_LENGTH = 255;
export const ADDRESS_CITY_MAX_LENGTH = 100;
export const ADDRESS_STATE_MAX_LENGTH = 100;
export const ADDRESS_POSTAL_CODE_MAX_LENGTH = 20;
export const ADDRESS_COUNTRY_CODE_LENGTH = 2;
export const ADDRESS_PHONE_MAX_LENGTH = 30;
export const ADDRESS_EMAIL_MAX_LENGTH = 255;

// ─── Shipment ─────────────────────────────────────────────────────────────────
export const SHIPMENT_CARRIER_MAX_LENGTH = 100;
export const SHIPMENT_SERVICE_MAX_LENGTH = 100;
export const SHIPMENT_TRACKING_NUMBER_MAX_LENGTH = 255;

// ─── Status History ───────────────────────────────────────────────────────────
export const STATUS_HISTORY_CHANGED_BY_MAX_LENGTH = 255;

// ─── Backorder / Preorder ─────────────────────────────────────────────────────
export const BACKORDER_ETA_MAX_DAYS_AHEAD = 365;
export const PREORDER_RELEASE_MAX_DAYS_AHEAD = 730; // 2 years
