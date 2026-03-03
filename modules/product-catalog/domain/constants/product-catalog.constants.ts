// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE = 1;

// ─── Product ──────────────────────────────────────────────────────────────────
export const PRODUCT_NAME_MIN_LENGTH = 2;
export const PRODUCT_NAME_MAX_LENGTH = 255;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 10_000;
export const PRODUCT_MAX_IMAGES = 20;
export const PRODUCT_MAX_VARIANTS = 100;
export const PRODUCT_MAX_TAGS = 20;

// ─── Category ─────────────────────────────────────────────────────────────────
export const CATEGORY_NAME_MIN_LENGTH = 2;
export const CATEGORY_NAME_MAX_LENGTH = 100;
export const CATEGORY_MAX_DEPTH = 5;

// ─── SKU ──────────────────────────────────────────────────────────────────────
export const SKU_MIN_LENGTH = 3;
export const SKU_MAX_LENGTH = 100;
export const SKU_PATTERN = /^[A-Z0-9_-]+$/;

// ─── Slug ─────────────────────────────────────────────────────────────────────
export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 255;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── Price ────────────────────────────────────────────────────────────────────
export const PRICE_MIN = 0;
export const PRICE_MAX = 9_999_999.99;
export const PRICE_DECIMAL_PLACES = 2;

// ─── Media ────────────────────────────────────────────────────────────────────
export const MEDIA_URL_MAX_LENGTH = 2048;
export const MEDIA_ALT_TEXT_MAX_LENGTH = 500;
export const MEDIA_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;

// ─── Search ───────────────────────────────────────────────────────────────────
export const SEARCH_QUERY_MIN_LENGTH = 1;
export const SEARCH_QUERY_MAX_LENGTH = 200;
export const SEARCH_MAX_RESULTS = 50;

// ─── Cache TTL (seconds) ──────────────────────────────────────────────────────
export const CACHE_TTL_PRODUCT = 300;         // 5 min
export const CACHE_TTL_CATEGORY = 600;        // 10 min
export const CACHE_TTL_SEARCH_RESULTS = 60;   // 1 min
export const CACHE_TTL_PRODUCT_LIST = 120;    // 2 min
