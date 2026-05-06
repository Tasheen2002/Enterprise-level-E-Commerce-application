// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Cart Item Quantity ────────────────────────────────────────────────────────
export const CART_ITEM_MIN_QUANTITY = 1;
export const CART_ITEM_MAX_QUANTITY = 999;

// ─── Currency ─────────────────────────────────────────────────────────────────
// Re-export the canonical default so cart-internal callers stay stable
// without importing through `packages/core` directly. The full
// `SUPPORTED_CURRENCIES` / `CURRENCY_NAMES` / `CURRENCY_SYMBOLS` /
// `CURRENCY_REGIONS` lists live in the shared kernel (consumed via the
// shared `Currency` VO); cart no longer maintains its own copies.
export { DEFAULT_CURRENCY } from "../../../../packages/core/src/domain/value-objects/currency.constants";

// ─── Guest Token ──────────────────────────────────────────────────────────────
export const GUEST_TOKEN_BYTE_LENGTH = 32;
export const GUEST_TOKEN_HEX_LENGTH = 64; // 32 bytes = 64 hex chars

// ─── Reservation ──────────────────────────────────────────────────────────────
export const RESERVATION_DEFAULT_DURATION_MINUTES = 30;
export const RESERVATION_MAX_DURATION_MINUTES = 120;
export const RESERVATION_EXPIRY_GRACE_PERIOD_HOURS = 1;
export const RESERVATION_EXPIRING_SOON_THRESHOLD_MINUTES = 5;

// ─── Checkout ─────────────────────────────────────────────────────────────────
export const CHECKOUT_DEFAULT_EXPIRY_MINUTES = 15;

// ─── Cart Reservation (ShoppingCart) ──────────────────────────────────────────
export const CART_RESERVATION_DEFAULT_EXTENSION_HOURS = 2;

// ─── Background Job Batching ──────────────────────────────────────────────────
export const RESERVATION_CLEANUP_BATCH_SIZE = 100;

// ─── Promo ────────────────────────────────────────────────────────────────────
export const PROMO_MAX_PERCENTAGE = 100;
export const VALID_PROMO_TYPES = [
  "percentage",
  "fixed_amount",
  "free_shipping",
  "buy_x_get_y",
] as const;
