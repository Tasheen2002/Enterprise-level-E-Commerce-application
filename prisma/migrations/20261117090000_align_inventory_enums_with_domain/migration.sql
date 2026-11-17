-- Align inventory enums with the values the domain and public API produce.
-- Before this, stock adjustments with reason 'return' or 'theft' updated stock
-- and then failed to record the ledger row, and purchase orders could not be
-- cancelled. Additive and idempotent; existing values are untouched.

-- AlterEnum
ALTER TYPE "inventory_management"."inv_txn_reason_enum" ADD VALUE IF NOT EXISTS 'return';
ALTER TYPE "inventory_management"."inv_txn_reason_enum" ADD VALUE IF NOT EXISTS 'theft';

-- AlterEnum
ALTER TYPE "inventory_management"."po_status_enum" ADD VALUE IF NOT EXISTS 'cancelled';
