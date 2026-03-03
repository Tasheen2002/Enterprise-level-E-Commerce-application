// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Payment Intent ───────────────────────────────────────────────────────────
export const VALID_PAYMENT_PROVIDERS = ["stripe"] as const;

// ─── BNPL ─────────────────────────────────────────────────────────────────────
export const BNPL_MIN_INSTALLMENTS = 2;
export const BNPL_MAX_INSTALLMENTS = 60;

// ─── Gift Card ────────────────────────────────────────────────────────────────
export const GIFT_CARD_CODE_MIN_LENGTH = 8;
export const GIFT_CARD_CODE_MAX_LENGTH = 32;
export const GIFT_CARD_MIN_AMOUNT = 0.01;

// ─── Promotion ────────────────────────────────────────────────────────────────
export const PROMOTION_CODE_MAX_LENGTH = 50;
export const PROMOTION_MAX_USAGE_PER_USER = 1;

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export const LOYALTY_MIN_POINTS = 0;
export const LOYALTY_MAX_POINTS_PER_TRANSACTION = 100_000;

// ─── Currency ─────────────────────────────────────────────────────────────────
export const PAYMENT_CURRENCY_CODE_LENGTH = 3;
export const DEFAULT_CURRENCY = "USD";
