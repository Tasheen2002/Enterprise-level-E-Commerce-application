// Pagination bounds for user-management list endpoints. Lives in
// `domain/constants/` for cross-module consistency with payment, loyalty,
// cart, order-management, and product-catalog (canonical location for
// invariant constants used by both domain and infra layers).
export const MIN_PAGE = 1;
export const MIN_LIMIT = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
