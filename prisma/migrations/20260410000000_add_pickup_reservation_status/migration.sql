-- AlterTable: add status column to pickup_reservations
ALTER TABLE "inventory_management"."pickup_reservations"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "pickup_reservations_status_idx" ON "inventory_management"."pickup_reservations"("status");
