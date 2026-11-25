/**
 * Storefront visibility for catalog content. Shoppers only see content that is
 * live; staff can see drafts, scheduled launches and archived items.
 */

/** A product is live when published, or scheduled and its launch time has passed. */
export function isProductLive(
  status: string,
  publishAt: Date | string | null,
  now: Date = new Date(),
): boolean {
  if (status === "published") return true;
  if (status !== "scheduled" || publishAt === null) return false;
  return new Date(publishAt).getTime() <= now.getTime();
}

/** An editorial look is live once its publication time has passed. */
export function isEditorialLookLive(
  publishedAt: Date | string | null,
  now: Date = new Date(),
): boolean {
  return publishedAt !== null && new Date(publishedAt).getTime() <= now.getTime();
}
