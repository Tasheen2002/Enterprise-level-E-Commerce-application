/** Listing queries are always paged: 50 per page by default, at most 100. */
export interface PageQuery {
  limit?: number;
  offset?: number;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function pageOf(query: PageQuery): { limit: number; offset: number } {
  const limit = Math.min(Math.max(Math.trunc(Number(query.limit) || DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
  const offset = Math.max(Math.trunc(Number(query.offset) || 0), 0);
  return { limit, offset };
}

/** Reads limit/offset from a request query string (other parameters are ignored). */
export function pageFromRequest(query: unknown): PageQuery {
  const q = (query ?? {}) as Record<string, unknown>;
  return {
    limit: q.limit === undefined ? undefined : Number(q.limit),
    offset: q.offset === undefined ? undefined : Number(q.offset),
  };
}
