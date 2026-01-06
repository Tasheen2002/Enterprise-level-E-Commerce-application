-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cart";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "customer_care";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "engagement";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "fulfillment";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory_management";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "order_management";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payment_loyalty";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "product_catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_management";

-- CreateEnum
CREATE TYPE "user_management"."user_status_enum" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "user_management"."user_role_enum" AS ENUM ('GUEST', 'CUSTOMER', 'STAFF', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "product_catalog"."product_status_enum" AS ENUM ('draft', 'published', 'scheduled');

-- CreateEnum
CREATE TYPE "product_catalog"."region_enum" AS ENUM ('UK', 'US', 'EU');

-- CreateEnum
CREATE TYPE "cart"."checkout_status_enum" AS ENUM ('pending', 'completed', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "order_management"."order_status_enum" AS ENUM ('created', 'paid', 'fulfilled', 'partially_returned', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "order_management"."order_source_enum" AS ENUM ('web', 'mobile');

-- CreateEnum
CREATE TYPE "inventory_management"."location_type_enum" AS ENUM ('warehouse', 'store');

-- CreateEnum
CREATE TYPE "inventory_management"."inv_txn_reason_enum" AS ENUM ('order', 'rma', 'po', 'adjustment', 'reservation', 'release', 'damage', 'loss', 'found', 'audit', 'shrinkage', 'correction');

-- CreateEnum
CREATE TYPE "inventory_management"."stock_alert_type_enum" AS ENUM ('low_stock', 'oos');

-- CreateEnum
CREATE TYPE "inventory_management"."po_status_enum" AS ENUM ('draft', 'sent', 'part_received', 'received', 'closed');

-- CreateEnum
CREATE TYPE "fulfillment"."shipment_status_enum" AS ENUM ('created', 'label_printed', 'in_transit', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "payment_loyalty"."payment_intent_status_enum" AS ENUM ('requires_action', 'authorized', 'captured', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_loyalty"."payment_txn_type_enum" AS ENUM ('auth', 'capture', 'refund', 'void');

-- CreateEnum
CREATE TYPE "payment_loyalty"."gift_card_txn_type_enum" AS ENUM ('issue', 'redeem', 'refund');

-- CreateEnum
CREATE TYPE "payment_loyalty"."loyalty_reason_enum" AS ENUM ('purchase', 'review', 'goodwill', 'refund');

-- CreateEnum
CREATE TYPE "customer_care"."ticket_source_enum" AS ENUM ('email', 'chat', 'phone');

-- CreateEnum
CREATE TYPE "customer_care"."ticket_sender_enum" AS ENUM ('agent', 'customer');

-- CreateEnum
CREATE TYPE "customer_care"."rma_type_enum" AS ENUM ('return', 'exchange', 'gift_return');

-- CreateEnum
CREATE TYPE "customer_care"."rma_status_enum" AS ENUM ('eligibility', 'approved', 'in_transit', 'received', 'refunded', 'rejected');

-- CreateEnum
CREATE TYPE "customer_care"."item_condition_enum" AS ENUM ('new', 'used', 'damaged');

-- CreateEnum
CREATE TYPE "customer_care"."item_disposition_enum" AS ENUM ('restock', 'repair', 'discard');

-- CreateEnum
CREATE TYPE "customer_care"."goodwill_type_enum" AS ENUM ('store_credit', 'discount', 'points');

-- CreateEnum
CREATE TYPE "engagement"."reminder_type_enum" AS ENUM ('restock', 'price_drop');

-- CreateEnum
CREATE TYPE "engagement"."contact_enum" AS ENUM ('email', 'phone');

-- CreateEnum
CREATE TYPE "engagement"."channel_enum" AS ENUM ('email', 'sms', 'whatsapp', 'push');

-- CreateEnum
CREATE TYPE "engagement"."reminder_status_enum" AS ENUM ('pending', 'sent', 'unsubscribed');

-- CreateEnum
CREATE TYPE "engagement"."notification_type_enum" AS ENUM ('order_confirm', 'shipped', 'restock', 'review_request', 'care_guide', 'promo');

-- CreateEnum
CREATE TYPE "engagement"."appointment_type_enum" AS ENUM ('stylist', 'in-store');

-- CreateEnum
CREATE TYPE "customer_care"."cm_sender_type_enum" AS ENUM ('user', 'agent');

-- CreateEnum
CREATE TYPE "analytics"."event_type_enum" AS ENUM ('product_view', 'purchase', 'add_to_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info');

-- CreateTable
CREATE TABLE "user_management"."users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "phone" TEXT,
    "role" "user_management"."user_role_enum" NOT NULL DEFAULT 'CUSTOMER',
    "status" "user_management"."user_status_enum" NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_management"."social_logins" (
    "social_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_logins_pkey" PRIMARY KEY ("social_id")
);

-- CreateTable
CREATE TABLE "user_management"."user_addresses" (
    "address_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT,
    "last_name" TEXT,
    "company" TEXT,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "user_management"."payment_methods" (
    "payment_method_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "billing_address_id" UUID,
    "provider_ref" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateTable
CREATE TABLE "user_management"."user_profiles" (
    "user_id" UUID NOT NULL,
    "default_address_id" UUID,
    "default_payment_method_id" UUID,
    "prefs" JSONB NOT NULL DEFAULT '{}',
    "locale" TEXT,
    "currency" TEXT,
    "style_preferences" JSONB NOT NULL DEFAULT '{}',
    "preferred_sizes" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."products" (
    "product_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT,
    "short_desc" TEXT,
    "long_desc_html" TEXT,
    "status" "product_catalog"."product_status_enum" NOT NULL DEFAULT 'draft',
    "publish_at" TIMESTAMPTZ(6),
    "country_of_origin" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."product_variants" (
    "variant_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "barcode" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "compare_at_price" DECIMAL(12,2),
    "weight_g" INTEGER,
    "dims" JSONB,
    "tax_class" TEXT,
    "allow_backorder" BOOLEAN NOT NULL DEFAULT false,
    "allow_preorder" BOOLEAN NOT NULL DEFAULT false,
    "restock_eta" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."categories" (
    "category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "position" INTEGER,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."media_assets" (
    "asset_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storage_key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" BIGINT,
    "alt_text" TEXT,
    "focal_x" INTEGER,
    "focal_y" INTEGER,
    "renditions" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."product_media" (
    "product_media_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "position" INTEGER,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("product_media_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."variant_media" (
    "variant_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,

    CONSTRAINT "variant_media_pkey" PRIMARY KEY ("variant_id","asset_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."product_tags" (
    "tag_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tag" TEXT NOT NULL,
    "kind" TEXT,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."product_tag_associations" (
    "product_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "product_tag_associations_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."size_guides" (
    "size_guide_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body_html" TEXT,
    "region" "product_catalog"."region_enum" NOT NULL,
    "category" TEXT,

    CONSTRAINT "size_guides_pkey" PRIMARY KEY ("size_guide_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."editorial_looks" (
    "look_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "story_html" TEXT,
    "hero_asset_id" UUID,
    "published_at" TIMESTAMPTZ(6),

    CONSTRAINT "editorial_looks_pkey" PRIMARY KEY ("look_id")
);

-- CreateTable
CREATE TABLE "product_catalog"."editorial_look_products" (
    "look_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "editorial_look_products_pkey" PRIMARY KEY ("look_id","product_id")
);

-- CreateTable
CREATE TABLE "cart"."shopping_carts" (
    "cart_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "guest_token" TEXT,
    "currency" TEXT,
    "email" TEXT,
    "shipping_method" TEXT,
    "shipping_option" TEXT,
    "is_gift" BOOLEAN NOT NULL DEFAULT false,
    "shipping_first_name" TEXT,
    "shipping_last_name" TEXT,
    "shipping_address_1" TEXT,
    "shipping_address_2" TEXT,
    "shipping_city" TEXT,
    "shipping_province" TEXT,
    "shipping_postal_code" TEXT,
    "shipping_country_code" TEXT,
    "shipping_phone" TEXT,
    "billing_first_name" TEXT,
    "billing_last_name" TEXT,
    "billing_address_1" TEXT,
    "billing_address_2" TEXT,
    "billing_city" TEXT,
    "billing_province" TEXT,
    "billing_postal_code" TEXT,
    "billing_country_code" TEXT,
    "billing_phone" TEXT,
    "same_address_for_billing" BOOLEAN NOT NULL DEFAULT true,
    "reservation_expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_carts_pkey" PRIMARY KEY ("cart_id")
);

-- CreateTable
CREATE TABLE "cart"."cart_items" (
    "cart_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price_snapshot" DECIMAL(12,2) NOT NULL,
    "applied_promos" JSONB NOT NULL DEFAULT '[]',
    "is_gift" BOOLEAN NOT NULL DEFAULT false,
    "gift_message" TEXT,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("cart_item_id")
);

-- CreateTable
CREATE TABLE "cart"."reservations" (
    "reservation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "cart"."checkouts" (
    "checkout_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "guest_token" TEXT,
    "cart_id" UUID NOT NULL,
    "status" "cart"."checkout_status_enum" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("checkout_id")
);

-- CreateTable
CREATE TABLE "order_management"."orders" (
    "order_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_no" TEXT NOT NULL,
    "user_id" UUID,
    "guest_token" TEXT,
    "checkout_id" UUID,
    "payment_intent_id" UUID,
    "totals" JSONB NOT NULL DEFAULT '{}',
    "status" "order_management"."order_status_enum" NOT NULL DEFAULT 'created',
    "source" "order_management"."order_source_enum" NOT NULL DEFAULT 'web',
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_management"."order_items" (
    "order_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "product_snapshot" JSONB NOT NULL DEFAULT '{}',
    "is_gift" BOOLEAN NOT NULL DEFAULT false,
    "gift_message" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "order_management"."order_addresses" (
    "order_id" UUID NOT NULL,
    "billing_snapshot" JSONB NOT NULL DEFAULT '{}',
    "shipping_snapshot" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_management"."order_shipments" (
    "shipment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "carrier" TEXT,
    "service" TEXT,
    "tracking_no" TEXT,
    "gift_receipt" BOOLEAN NOT NULL DEFAULT false,
    "pickup_location_id" UUID,
    "shipped_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),

    CONSTRAINT "order_shipments_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateTable
CREATE TABLE "order_management"."order_status_history" (
    "history_id" BIGSERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "order_management"."order_status_enum",
    "to_status" "order_management"."order_status_enum" NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "order_management"."backorders" (
    "order_item_id" UUID NOT NULL,
    "promised_eta" TIMESTAMPTZ(6),
    "notified_at" TIMESTAMPTZ(6),

    CONSTRAINT "backorders_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "order_management"."preorders" (
    "order_item_id" UUID NOT NULL,
    "release_date" TIMESTAMPTZ(6),
    "notified_at" TIMESTAMPTZ(6),

    CONSTRAINT "preorders_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "order_management"."order_events" (
    "event_id" BIGSERIAL NOT NULL,
    "order_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "fulfillment"."shipments" (
    "shipment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "carrier" TEXT,
    "service" TEXT,
    "label_url" TEXT,
    "status" "fulfillment"."shipment_status_enum" NOT NULL DEFAULT 'created',
    "shipped_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_gift" BOOLEAN NOT NULL DEFAULT false,
    "gift_message" TEXT,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateTable
CREATE TABLE "fulfillment"."shipment_items" (
    "shipment_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "gift_wrap" BOOLEAN NOT NULL DEFAULT false,
    "gift_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("shipment_id","order_item_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."locations" (
    "location_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "inventory_management"."location_type_enum" NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."inventory_stocks" (
    "variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER,
    "safety_stock" INTEGER,

    CONSTRAINT "inventory_stocks_pkey" PRIMARY KEY ("variant_id","location_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."inventory_transactions" (
    "inv_txn_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "qty_delta" INTEGER NOT NULL,
    "reason" "inventory_management"."inv_txn_reason_enum" NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("inv_txn_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."stock_alerts" (
    "alert_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variant_id" UUID NOT NULL,
    "type" "inventory_management"."stock_alert_type_enum" NOT NULL,
    "triggered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."suppliers" (
    "supplier_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "lead_time_days" INTEGER,
    "contacts" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."purchase_orders" (
    "po_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_id" UUID NOT NULL,
    "eta" TIMESTAMPTZ(6),
    "status" "inventory_management"."po_status_enum" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."purchase_order_items" (
    "po_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "ordered_qty" INTEGER NOT NULL,
    "received_qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("po_id","variant_id")
);

-- CreateTable
CREATE TABLE "inventory_management"."pickup_reservations" (
    "reservation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pickup_reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."payment_intents" (
    "intent_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "checkout_id" UUID,
    "idempotency_key" TEXT,
    "provider" TEXT NOT NULL,
    "status" "payment_loyalty"."payment_intent_status_enum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "client_secret" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("intent_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."payment_transactions" (
    "txn_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "intent_id" UUID NOT NULL,
    "type" "payment_loyalty"."payment_txn_type_enum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "failure_reason" TEXT,
    "psp_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("txn_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."bnpl_transactions" (
    "bnpl_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "intent_id" UUID,
    "order_id" UUID,
    "provider" TEXT NOT NULL,
    "plan" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnpl_transactions_pkey" PRIMARY KEY ("bnpl_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."gift_cards" (
    "gift_card_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "initial_balance" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("gift_card_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."gift_card_transactions" (
    "gc_txn_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gift_card_id" UUID NOT NULL,
    "order_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "payment_loyalty"."gift_card_txn_type_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transactions_pkey" PRIMARY KEY ("gc_txn_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."promotions" (
    "promo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT,
    "rule" JSONB NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "usage_limit" INTEGER,
    "status" TEXT,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("promo_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."promotion_usage" (
    "promo_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "promotion_usage_pkey" PRIMARY KEY ("promo_id","order_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."loyalty_programs" (
    "program_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "earn_rules" JSONB NOT NULL DEFAULT '{}',
    "burn_rules" JSONB NOT NULL DEFAULT '{}',
    "tiers" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."loyalty_accounts" (
    "account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "points_balance" BIGINT NOT NULL DEFAULT 0,
    "tier" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."loyalty_transactions" (
    "ltxn_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "points_delta" INTEGER NOT NULL,
    "reason" "payment_loyalty"."loyalty_reason_enum" NOT NULL,
    "order_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("ltxn_id")
);

-- CreateTable
CREATE TABLE "payment_loyalty"."payment_webhook_events" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "customer_care"."support_tickets" (
    "ticket_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "order_id" UUID,
    "source" "customer_care"."ticket_source_enum" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("ticket_id")
);

-- CreateTable
CREATE TABLE "customer_care"."ticket_messages" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "sender" "customer_care"."ticket_sender_enum" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "customer_care"."support_agents" (
    "agent_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "roster" JSONB NOT NULL DEFAULT '[]',
    "skills" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "support_agents_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "customer_care"."chat_sessions" (
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "agent_id" UUID,
    "status" TEXT,
    "topic" TEXT,
    "priority" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "customer_care"."chat_messages" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "sender_id" UUID,
    "sender_type" "customer_care"."cm_sender_type_enum" NOT NULL,
    "message_type" TEXT,
    "content" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_automated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "customer_care"."return_requests" (
    "rma_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "type" "customer_care"."rma_type_enum" NOT NULL,
    "reason" TEXT,
    "status" "customer_care"."rma_status_enum" NOT NULL DEFAULT 'eligibility',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("rma_id")
);

-- CreateTable
CREATE TABLE "customer_care"."return_items" (
    "rma_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "condition" "customer_care"."item_condition_enum",
    "disposition" "customer_care"."item_disposition_enum",
    "fees" DECIMAL(12,2),

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("rma_id","order_item_id")
);

-- CreateTable
CREATE TABLE "customer_care"."repairs" (
    "repair_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_item_id" UUID NOT NULL,
    "notes" TEXT,
    "status" TEXT,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("repair_id")
);

-- CreateTable
CREATE TABLE "customer_care"."goodwill_records" (
    "goodwill_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "order_id" UUID,
    "type" "customer_care"."goodwill_type_enum" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goodwill_records_pkey" PRIMARY KEY ("goodwill_id")
);

-- CreateTable
CREATE TABLE "customer_care"."customer_feedback" (
    "feedback_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "ticket_id" UUID,
    "order_id" UUID,
    "nps_score" INTEGER,
    "csat_score" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "engagement"."wishlists" (
    "wishlist_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "guest_token" TEXT,
    "name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "engagement"."wishlist_items" (
    "wishlist_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("wishlist_id","variant_id")
);

-- CreateTable
CREATE TABLE "engagement"."reminders" (
    "reminder_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "engagement"."reminder_type_enum" NOT NULL,
    "variant_id" UUID NOT NULL,
    "user_id" UUID,
    "contact" "engagement"."contact_enum" NOT NULL,
    "channel" "engagement"."channel_enum" NOT NULL,
    "opt_in_at" TIMESTAMPTZ(6),
    "status" "engagement"."reminder_status_enum" NOT NULL DEFAULT 'pending',

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateTable
CREATE TABLE "engagement"."notifications" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "engagement"."notification_type_enum" NOT NULL,
    "channel" "engagement"."channel_enum",
    "template_id" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "error" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "engagement"."product_reviews" (
    "review_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "engagement"."appointments" (
    "appt_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "engagement"."appointment_type_enum" NOT NULL,
    "location_id" UUID,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("appt_id")
);

-- CreateTable
CREATE TABLE "engagement"."newsletter_subscriptions" (
    "subscription_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "status" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "analytics"."analytics_events" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_type" "analytics"."event_type_enum" NOT NULL,
    "user_id" UUID,
    "guest_token" TEXT,
    "session_id" TEXT NOT NULL,
    "product_id" UUID,
    "variant_id" UUID,
    "cart_id" UUID,
    "event_data" JSONB,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "referrer" TEXT,
    "event_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "user_management"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "social_logins_provider_user_id_key" ON "user_management"."social_logins"("provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "product_catalog"."products"("slug");

-- CreateIndex
CREATE INDEX "idx_products_publish_at" ON "product_catalog"."products"("publish_at");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "product_catalog"."products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_catalog"."product_variants"("sku");

-- CreateIndex
CREATE INDEX "idx_variants_product_id" ON "product_catalog"."product_variants"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "product_catalog"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_tag_key" ON "product_catalog"."product_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_carts_guest_token_key" ON "cart"."shopping_carts"("guest_token");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_cart_id_variant_id_key" ON "cart"."reservations"("cart_id", "variant_id");

-- CreateIndex
CREATE INDEX "idx_checkouts_user_id" ON "cart"."checkouts"("user_id");

-- CreateIndex
CREATE INDEX "idx_checkouts_status" ON "cart"."checkouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "order_management"."orders"("order_no");

-- CreateIndex
CREATE INDEX "idx_orders_user_id" ON "order_management"."orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_orders_checkout_id" ON "order_management"."orders"("checkout_id");

-- CreateIndex
CREATE INDEX "idx_order_items_order_id" ON "order_management"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_fulfillment_shipments_order_id" ON "fulfillment"."shipments"("order_id");

-- CreateIndex
CREATE INDEX "idx_fulfillment_shipments_status" ON "fulfillment"."shipments"("status");

-- CreateIndex
CREATE INDEX "idx_fulfillment_shipments_created_at" ON "fulfillment"."shipments"("created_at");

-- CreateIndex
CREATE INDEX "idx_shipments_order_id" ON "fulfillment"."shipments"("order_id");

-- CreateIndex
CREATE INDEX "idx_inv_txn_variant" ON "inventory_management"."inventory_transactions"("variant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_checkout_id_key" ON "payment_loyalty"."payment_intents"("checkout_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_idempotency_key_key" ON "payment_loyalty"."payment_intents"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_payment_txn_intent_id" ON "payment_loyalty"."payment_transactions"("intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_code_key" ON "payment_loyalty"."gift_cards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "payment_loyalty"."promotions"("code");

-- CreateIndex
CREATE INDEX "idx_reminders_variant" ON "engagement"."reminders"("variant_id");

-- CreateIndex
CREATE INDEX "idx_reviews_product_id" ON "engagement"."product_reviews"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "engagement"."newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_idx" ON "analytics"."analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "analytics_events_product_id_idx" ON "analytics"."analytics_events"("product_id");

-- CreateIndex
CREATE INDEX "analytics_events_variant_id_idx" ON "analytics"."analytics_events"("variant_id");

-- CreateIndex
CREATE INDEX "analytics_events_cart_id_idx" ON "analytics"."analytics_events"("cart_id");

-- CreateIndex
CREATE INDEX "analytics_events_user_id_idx" ON "analytics"."analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "analytics_events_guest_token_idx" ON "analytics"."analytics_events"("guest_token");

-- CreateIndex
CREATE INDEX "analytics_events_session_id_idx" ON "analytics"."analytics_events"("session_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_timestamp_idx" ON "analytics"."analytics_events"("event_timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_product_id_idx" ON "analytics"."analytics_events"("event_type", "product_id");

-- CreateIndex
CREATE INDEX "analytics_events_event_type_event_timestamp_idx" ON "analytics"."analytics_events"("event_type", "event_timestamp");

-- AddForeignKey
ALTER TABLE "user_management"."social_logins" ADD CONSTRAINT "social_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."payment_methods" ADD CONSTRAINT "payment_methods_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "user_management"."user_addresses"("address_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."user_profiles" ADD CONSTRAINT "user_profiles_default_address_id_fkey" FOREIGN KEY ("default_address_id") REFERENCES "user_management"."user_addresses"("address_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."user_profiles" ADD CONSTRAINT "user_profiles_default_payment_method_id_fkey" FOREIGN KEY ("default_payment_method_id") REFERENCES "user_management"."payment_methods"("payment_method_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_management"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_catalog"."categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_catalog"."categories"("category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_media" ADD CONSTRAINT "product_media_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "product_catalog"."media_assets"("asset_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."variant_media" ADD CONSTRAINT "variant_media_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "product_catalog"."media_assets"("asset_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."variant_media" ADD CONSTRAINT "variant_media_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_tag_associations" ADD CONSTRAINT "product_tag_associations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."product_tag_associations" ADD CONSTRAINT "product_tag_associations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "product_catalog"."product_tags"("tag_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."editorial_looks" ADD CONSTRAINT "editorial_looks_hero_asset_id_fkey" FOREIGN KEY ("hero_asset_id") REFERENCES "product_catalog"."media_assets"("asset_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."editorial_look_products" ADD CONSTRAINT "editorial_look_products_look_id_fkey" FOREIGN KEY ("look_id") REFERENCES "product_catalog"."editorial_looks"("look_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_catalog"."editorial_look_products" ADD CONSTRAINT "editorial_look_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."shopping_carts" ADD CONSTRAINT "shopping_carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"."shopping_carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."reservations" ADD CONSTRAINT "reservations_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"."shopping_carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."reservations" ADD CONSTRAINT "reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."checkouts" ADD CONSTRAINT "checkouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart"."checkouts" ADD CONSTRAINT "checkouts_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"."shopping_carts"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."orders" ADD CONSTRAINT "orders_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "cart"."checkouts"("checkout_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_management"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_addresses" ADD CONSTRAINT "order_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_shipments" ADD CONSTRAINT "order_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_shipments" ADD CONSTRAINT "order_shipments_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "inventory_management"."locations"("location_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."backorders" ADD CONSTRAINT "backorders_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_management"."order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."preorders" ADD CONSTRAINT "preorders_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_management"."order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_management"."order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fulfillment"."shipment_items" ADD CONSTRAINT "shipment_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_management"."order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fulfillment"."shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "fulfillment"."shipments"("shipment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."inventory_stocks" ADD CONSTRAINT "inventory_stocks_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_management"."locations"("location_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."inventory_stocks" ADD CONSTRAINT "inventory_stocks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_management"."locations"("location_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."stock_alerts" ADD CONSTRAINT "stock_alerts_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "inventory_management"."suppliers"("supplier_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "inventory_management"."purchase_orders"("po_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."pickup_reservations" ADD CONSTRAINT "pickup_reservations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_management"."locations"("location_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."pickup_reservations" ADD CONSTRAINT "pickup_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_management"."pickup_reservations" ADD CONSTRAINT "pickup_reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."payment_intents" ADD CONSTRAINT "payment_intents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."payment_intents" ADD CONSTRAINT "payment_intents_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "cart"."checkouts"("checkout_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."payment_transactions" ADD CONSTRAINT "payment_transactions_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payment_loyalty"."payment_intents"("intent_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."bnpl_transactions" ADD CONSTRAINT "bnpl_transactions_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payment_loyalty"."payment_intents"("intent_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."bnpl_transactions" ADD CONSTRAINT "bnpl_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "payment_loyalty"."gift_cards"("gift_card_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."promotion_usage" ADD CONSTRAINT "promotion_usage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."promotion_usage" ADD CONSTRAINT "promotion_usage_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "payment_loyalty"."promotions"("promo_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "payment_loyalty"."loyalty_programs"("program_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "payment_loyalty"."loyalty_accounts"("account_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_loyalty"."loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "customer_care"."support_tickets"("ticket_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."chat_sessions" ADD CONSTRAINT "chat_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "customer_care"."support_agents"("agent_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_care"."chat_sessions"("session_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_management"."order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."return_items" ADD CONSTRAINT "return_items_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "customer_care"."return_requests"("rma_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."repairs" ADD CONSTRAINT "repairs_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_management"."order_items"("order_item_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."goodwill_records" ADD CONSTRAINT "goodwill_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."goodwill_records" ADD CONSTRAINT "goodwill_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."customer_feedback" ADD CONSTRAINT "customer_feedback_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("order_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."customer_feedback" ADD CONSTRAINT "customer_feedback_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "customer_care"."support_tickets"("ticket_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_care"."customer_feedback" ADD CONSTRAINT "customer_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "engagement"."wishlists"("wishlist_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."reminders" ADD CONSTRAINT "reminders_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_catalog"."product_variants"("variant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"."products"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."appointments" ADD CONSTRAINT "appointments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "inventory_management"."locations"("location_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "engagement"."appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
