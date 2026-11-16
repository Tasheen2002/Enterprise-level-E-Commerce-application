-- Remove indexes that duplicate another index on the same columns. They add
-- write and storage cost without serving any query the remaining index cannot.

-- Same columns as idx_fulfillment_shipments_order_id (both created by init).
-- Prisma's differ matches indexes by columns, so it does not report this one.
DROP INDEX IF EXISTS "fulfillment"."idx_shipments_order_id";

-- Covered by the unique constraint index loyalty_accounts_user_id_key.
DROP INDEX IF EXISTS "payment_loyalty"."loyalty_accounts_user_id_idx";
