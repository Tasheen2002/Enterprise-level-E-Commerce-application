-- AlterTable
ALTER TABLE "user_management"."users" ADD COLUMN "stripe_customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "user_management"."users"("stripe_customer_id");
