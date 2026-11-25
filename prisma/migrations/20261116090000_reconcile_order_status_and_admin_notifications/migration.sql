-- Reconcile drift between the migration history and schema.prisma.
-- Databases built with `prisma migrate deploy` lacked these objects (they only
-- existed where `prisma db push` had been used). IF NOT EXISTS keeps this safe
-- for databases that already received them through db push.
-- PostgreSQL 12+ allows ALTER TYPE ... ADD VALUE inside a transaction; the new
-- values are not used within this migration.

-- Order statuses, positioned to match the enum order in schema.prisma.
ALTER TYPE "order_management"."order_status_enum" ADD VALUE IF NOT EXISTS 'pending' AFTER 'created';
ALTER TYPE "order_management"."order_status_enum" ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'pending';
ALTER TYPE "order_management"."order_status_enum" ADD VALUE IF NOT EXISTS 'processing' AFTER 'paid';
ALTER TYPE "order_management"."order_status_enum" ADD VALUE IF NOT EXISTS 'shipped' AFTER 'processing';
ALTER TYPE "order_management"."order_status_enum" ADD VALUE IF NOT EXISTS 'delivered' AFTER 'shipped';

-- Admin in-app notifications (written during checkout and order creation).
CREATE TABLE IF NOT EXISTS "order_management"."admin_notifications" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "target_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("notification_id")
);

CREATE INDEX IF NOT EXISTS "admin_notifications_is_read_created_at_idx"
    ON "order_management"."admin_notifications"("is_read", "created_at");
