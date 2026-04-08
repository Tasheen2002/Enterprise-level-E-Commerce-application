-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES FOR E-COMMERCE PLATFORM
-- ============================================================================
-- Execute this SQL script after reviewing the DATABASE_INDEX_STRATEGY.md
-- Or add these as @@index[] directives in your Prisma schema.prisma file
-- ============================================================================

-- USER MANAGEMENT SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_status ON user_management.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON user_management.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_guest ON user_management.users(is_guest);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON user_management.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON user_management.users(status, role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON user_management.users(email_verified);

CREATE INDEX IF NOT EXISTS idx_social_logins_user_id ON user_management.social_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_social_logins_provider ON user_management.social_logins(provider);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_management.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id_is_default ON user_management.user_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_addresses_country ON user_management.user_addresses(country);
CREATE INDEX IF NOT EXISTS idx_user_addresses_type ON user_management.user_addresses(type);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON user_management.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id_is_default ON user_management.payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_billing_address_id ON user_management.payment_methods(billing_address_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider_ref ON user_management.payment_methods(provider_ref);

-- PRODUCT CATALOG SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_brand ON product_catalog.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status_publish_at ON product_catalog.products(status, publish_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON product_catalog.products(created_at);

CREATE INDEX IF NOT EXISTS idx_variants_product_id_color ON product_catalog.product_variants(product_id, color);
CREATE INDEX IF NOT EXISTS idx_variants_product_id_size ON product_catalog.product_variants(product_id, size);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_catalog.product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_variants_price ON product_catalog.product_variants(price);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_catalog.product_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON product_catalog.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_position ON product_catalog.categories(position);

CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_catalog.product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_asset_id ON product_catalog.product_media(asset_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id_position ON product_catalog.product_media(product_id, position);

CREATE INDEX IF NOT EXISTS idx_product_tags_kind ON product_catalog.product_tags(kind);

CREATE INDEX IF NOT EXISTS idx_product_tag_assoc_tag_id ON product_catalog.product_tag_associations(tag_id);

-- CART SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON cart.shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id_created_at ON cart.shopping_carts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_guest_token_updated_at ON cart.shopping_carts(guest_token, updated_at);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_reservation_expires_at ON cart.shopping_carts(reservation_expires_at);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart.cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id_variant_id ON cart.cart_items(cart_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_reservations_cart_id ON cart.reservations(cart_id);
CREATE INDEX IF NOT EXISTS idx_reservations_variant_id ON cart.reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON cart.reservations(expires_at);

CREATE INDEX IF NOT EXISTS idx_checkouts_cart_id ON cart.checkouts(cart_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_guest_token ON cart.checkouts(guest_token);
CREATE INDEX IF NOT EXISTS idx_checkouts_expires_at ON cart.checkouts(expires_at);

-- ORDER MANAGEMENT SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON order_management.orders(guest_token);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON order_management.orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON order_management.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON order_management.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON order_management.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status ON order_management.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON order_management.orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON order_management.orders(status, created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_management.order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON order_management.order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_tracking_no ON order_management.order_shipments(tracking_no);
CREATE INDEX IF NOT EXISTS idx_order_shipments_pickup_location_id ON order_management.order_shipments(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_shipped_at ON order_management.order_shipments(shipped_at);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_management.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_management.order_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_order_status_history_to_status ON order_management.order_status_history(to_status);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_management.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON order_management.order_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_management.order_events(created_at);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id_event_type ON order_management.order_events(order_id, event_type);

CREATE INDEX IF NOT EXISTS idx_backorders_promised_eta ON order_management.backorders(promised_eta);

CREATE INDEX IF NOT EXISTS idx_preorders_release_date ON order_management.preorders(release_date);

-- FULFILLMENT SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON fulfillment.shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_service ON fulfillment.shipments(service);
CREATE INDEX IF NOT EXISTS idx_shipments_shipped_at ON fulfillment.shipments(shipped_at);
CREATE INDEX IF NOT EXISTS idx_shipments_delivered_at ON fulfillment.shipments(delivered_at);
CREATE INDEX IF NOT EXISTS idx_shipments_updated_at ON fulfillment.shipments(updated_at);

CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item_id ON fulfillment.shipment_items(order_item_id);

-- INVENTORY MANAGEMENT SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locations_type ON inventory_management.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_name ON inventory_management.locations(name);

CREATE INDEX IF NOT EXISTS idx_inventory_stocks_location_id ON inventory_management.inventory_stocks(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_on_hand ON inventory_management.inventory_stocks(on_hand);

CREATE INDEX IF NOT EXISTS idx_inventory_txns_location_id ON inventory_management.inventory_transactions(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txns_reason ON inventory_management.inventory_transactions(reason);
CREATE INDEX IF NOT EXISTS idx_inventory_txns_ref_type_ref_id ON inventory_management.inventory_transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_variant_id ON inventory_management.stock_alerts(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_type ON inventory_management.stock_alerts(type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_triggered_at ON inventory_management.stock_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved_at ON inventory_management.stock_alerts(resolved_at);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON inventory_management.suppliers(name);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON inventory_management.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON inventory_management.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_eta ON inventory_management.purchase_orders(eta);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_eta ON inventory_management.purchase_orders(status, eta);

CREATE INDEX IF NOT EXISTS idx_po_items_variant_id ON inventory_management.purchase_order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_pickup_reservations_order_id ON inventory_management.pickup_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_pickup_reservations_location_id ON inventory_management.pickup_reservations(location_id);
CREATE INDEX IF NOT EXISTS idx_pickup_reservations_variant_id ON inventory_management.pickup_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_pickup_reservations_expires_at ON inventory_management.pickup_reservations(expires_at);

-- PAYMENT LOYALTY SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_loyalty.payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider ON payment_loyalty.payment_intents(provider);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_loyalty.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_client_secret ON payment_loyalty.payment_intents(client_secret);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status_created_at ON payment_loyalty.payment_intents(status, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_txns_type ON payment_loyalty.payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_txns_status ON payment_loyalty.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_txns_psp_ref ON payment_loyalty.payment_transactions(psp_ref);
CREATE INDEX IF NOT EXISTS idx_payment_txns_created_at ON payment_loyalty.payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_bnpl_txns_order_id ON payment_loyalty.bnpl_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_bnpl_txns_intent_id ON payment_loyalty.bnpl_transactions(intent_id);
CREATE INDEX IF NOT EXISTS idx_bnpl_txns_provider ON payment_loyalty.bnpl_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_bnpl_txns_status ON payment_loyalty.bnpl_transactions(status);

CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON payment_loyalty.gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON payment_loyalty.gift_cards(expires_at);

CREATE INDEX IF NOT EXISTS idx_gc_txns_gift_card_id ON payment_loyalty.gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_txns_order_id ON payment_loyalty.gift_card_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_gc_txns_type ON payment_loyalty.gift_card_transactions(type);
CREATE INDEX IF NOT EXISTS idx_gc_txns_created_at ON payment_loyalty.gift_card_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_promotions_status ON payment_loyalty.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_starts_at ON payment_loyalty.promotions(starts_at);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at ON payment_loyalty.promotions(ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_status_starts_ends ON payment_loyalty.promotions(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promo_usage_order_id ON payment_loyalty.promotion_usage(order_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_name ON payment_loyalty.loyalty_programs(name);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON payment_loyalty.loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_program_id ON payment_loyalty.loyalty_accounts(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tier ON payment_loyalty.loyalty_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_points_balance ON payment_loyalty.loyalty_accounts(points_balance);

CREATE INDEX IF NOT EXISTS idx_loyalty_txns_account_id ON payment_loyalty.loyalty_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txns_order_id ON payment_loyalty.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txns_reason ON payment_loyalty.loyalty_transactions(reason);
CREATE INDEX IF NOT EXISTS idx_loyalty_txns_created_at ON payment_loyalty.loyalty_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON payment_loyalty.payment_webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON payment_loyalty.payment_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON payment_loyalty.payment_webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type ON payment_loyalty.payment_webhook_events(provider, event_type);

-- CUSTOMER CARE SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON customer_care.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order_id ON customer_care.support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON customer_care.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON customer_care.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON customer_care.support_tickets(source);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON customer_care.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON customer_care.support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at ON customer_care.support_tickets(status, created_at);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON customer_care.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON customer_care.ticket_messages(sender);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON customer_care.ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_support_agents_name ON customer_care.support_agents(name);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON customer_care.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON customer_care.chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON customer_care.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started_at ON customer_care.chat_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id_status ON customer_care.chat_sessions(agent_id, status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON customer_care.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON customer_care.chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON customer_care.chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON customer_care.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_type ON customer_care.return_requests(type);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON customer_care.return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created_at ON customer_care.return_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_return_requests_status_created_at ON customer_care.return_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON customer_care.return_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_return_items_condition ON customer_care.return_items(condition);
CREATE INDEX IF NOT EXISTS idx_return_items_disposition ON customer_care.return_items(disposition);

CREATE INDEX IF NOT EXISTS idx_repairs_order_item_id ON customer_care.repairs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON customer_care.repairs(status);

CREATE INDEX IF NOT EXISTS idx_goodwill_records_user_id ON customer_care.goodwill_records(user_id);
CREATE INDEX IF NOT EXISTS idx_goodwill_records_order_id ON customer_care.goodwill_records(order_id);
CREATE INDEX IF NOT EXISTS idx_goodwill_records_type ON customer_care.goodwill_records(type);
CREATE INDEX IF NOT EXISTS idx_goodwill_records_created_at ON customer_care.goodwill_records(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_feedback_user_id ON customer_care.customer_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_ticket_id ON customer_care.customer_feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_order_id ON customer_care.customer_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_nps ON customer_care.customer_feedback(nps_score);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_csat ON customer_care.customer_feedback(csat_score);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_created_at ON customer_care.customer_feedback(created_at);

-- ENGAGEMENT SCHEMA
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON engagement.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_guest_token ON engagement.wishlists(guest_token);
CREATE INDEX IF NOT EXISTS idx_wishlists_is_default ON engagement.wishlists(is_default);
CREATE INDEX IF NOT EXISTS idx_wishlists_is_public ON engagement.wishlists(is_public);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_variant_id ON engagement.wishlist_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON engagement.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON engagement.reminders(type);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON engagement.reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_opt_in_at ON engagement.reminders(opt_in_at);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON engagement.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON engagement.notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_template_id ON engagement.notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON engagement.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON engagement.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON engagement.notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled_at ON engagement.notifications(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON engagement.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON engagement.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON engagement.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON engagement.product_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id_status ON engagement.product_reviews(product_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON engagement.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location_id ON engagement.appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON engagement.appointments(type);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON engagement.appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_location_id_start_at ON engagement.appointments(location_id, start_at);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON engagement.newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_source ON engagement.newsletter_subscriptions(source);

-- ============================================================================
-- ANALYZE TABLES AFTER INDEX CREATION
-- ============================================================================

ANALYZE user_management.users;
ANALYZE user_management.user_addresses;
ANALYZE user_management.payment_methods;
ANALYZE product_catalog.products;
ANALYZE product_catalog.product_variants;
ANALYZE cart.shopping_carts;
ANALYZE cart.checkouts;
ANALYZE order_management.orders;
ANALYZE inventory_management.inventory_stocks;
ANALYZE payment_loyalty.payment_intents;
ANALYZE customer_care.support_tickets;
ANALYZE engagement.product_reviews;
ANALYZE analytics.analytics_events;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check index count by schema
SELECT 
    schemaname,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY index_count DESC;

-- Check table sizes with index sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
