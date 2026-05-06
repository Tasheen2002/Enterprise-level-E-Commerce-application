/*
  Warnings:

  - You are about to drop the column `points_balance` on the `loyalty_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `program_id` on the `loyalty_accounts` table. All the data in the column will be lost.
  - The primary key for the `loyalty_transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ltxn_id` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `points_delta` on the `loyalty_transactions` table. All the data in the column will be lost.
  - The primary key for the `promotion_usage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[user_id]` on the table `loyalty_accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[promo_id,order_id]` on the table `promotion_usage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joined_at` to the `loyalty_accounts` table without a default value. This is not possible if the table is not empty.
  - Made the column `tier` on table `loyalty_accounts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `balance_after` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `reason` on the `loyalty_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "product_catalog"."product_status_enum" ADD VALUE 'archived';

-- DropForeignKey
ALTER TABLE "payment_loyalty"."loyalty_accounts" DROP CONSTRAINT "loyalty_accounts_program_id_fkey";

-- DropIndex
DROP INDEX "payment_loyalty"."loyalty_accounts_points_balance_idx";

-- DropIndex
DROP INDEX "payment_loyalty"."loyalty_accounts_program_id_idx";

-- AlterTable
ALTER TABLE "cart"."cart_items" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."appointments" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."newsletter_subscriptions" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."notifications" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."product_reviews" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."reminders" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "engagement"."wishlist_items" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "order_management"."order_events" ADD COLUMN     "logged_by" TEXT;

-- AlterTable
ALTER TABLE "payment_loyalty"."gift_cards" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "recipient_email" TEXT,
ADD COLUMN     "recipient_name" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payment_loyalty"."loyalty_accounts" DROP COLUMN "points_balance",
DROP COLUMN "program_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_balance" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "joined_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "last_activity_at" TIMESTAMPTZ(6),
ADD COLUMN     "lifetime_points" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "total_points_earned" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "total_points_redeemed" BIGINT NOT NULL DEFAULT 0,
ALTER COLUMN "tier" SET NOT NULL,
ALTER COLUMN "tier" SET DEFAULT 'STYLE_LOVER';

-- AlterTable
ALTER TABLE "payment_loyalty"."loyalty_programs" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "earn_rules" SET DEFAULT '[]',
ALTER COLUMN "burn_rules" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "payment_loyalty"."loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_pkey",
DROP COLUMN "ltxn_id",
DROP COLUMN "points_delta",
ADD COLUMN     "balance_after" BIGINT NOT NULL,
ADD COLUMN     "created_by" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "points" BIGINT NOT NULL,
ADD COLUMN     "reference_id" UUID,
ADD COLUMN     "transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "reason",
ADD COLUMN     "reason" TEXT NOT NULL,
ADD CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("transaction_id");

-- AlterTable
ALTER TABLE "payment_loyalty"."payment_transactions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payment_loyalty"."promotion_usage" DROP CONSTRAINT "promotion_usage_pkey",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "usage_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "promotion_usage_pkey" PRIMARY KEY ("usage_id");

-- AlterTable
ALTER TABLE "payment_loyalty"."promotions" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."categories" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."editorial_looks" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."media_assets" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."product_media" ADD COLUMN     "alt" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."product_tag_associations" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."product_tags" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."products" ADD COLUMN     "compare_at_price" DECIMAL(12,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SGD',
ADD COLUMN     "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "price_sgd" DECIMAL(12,2),
ADD COLUMN     "price_usd" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "product_catalog"."size_guides" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_catalog"."variant_media" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "payment_loyalty"."loyalty_reason_enum";

-- CreateIndex
CREATE INDEX "order_events_logged_by_idx" ON "order_management"."order_events"("logged_by");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_user_id_key" ON "payment_loyalty"."loyalty_accounts"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_accounts_current_balance_idx" ON "payment_loyalty"."loyalty_accounts"("current_balance");

-- CreateIndex
CREATE INDEX "loyalty_transactions_type_idx" ON "payment_loyalty"."loyalty_transactions"("type");

-- CreateIndex
CREATE INDEX "loyalty_transactions_reason_idx" ON "payment_loyalty"."loyalty_transactions"("reason");

-- CreateIndex
CREATE INDEX "loyalty_transactions_expires_at_idx" ON "payment_loyalty"."loyalty_transactions"("expires_at");

-- CreateIndex
CREATE INDEX "promotion_usage_promo_id_idx" ON "payment_loyalty"."promotion_usage"("promo_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_usage_promo_id_order_id_key" ON "payment_loyalty"."promotion_usage"("promo_id", "order_id");
