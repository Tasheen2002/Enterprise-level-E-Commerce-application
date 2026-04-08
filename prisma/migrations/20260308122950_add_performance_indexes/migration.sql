-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart"."cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "cart"."cart_items"("variant_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_variant_id_idx" ON "cart"."cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE INDEX "checkouts_cart_id_idx" ON "cart"."checkouts"("cart_id");

-- CreateIndex
CREATE INDEX "checkouts_guest_token_idx" ON "cart"."checkouts"("guest_token");

-- CreateIndex
CREATE INDEX "checkouts_expires_at_idx" ON "cart"."checkouts"("expires_at");

-- CreateIndex
CREATE INDEX "reservations_cart_id_idx" ON "cart"."reservations"("cart_id");

-- CreateIndex
CREATE INDEX "reservations_variant_id_idx" ON "cart"."reservations"("variant_id");

-- CreateIndex
CREATE INDEX "reservations_expires_at_idx" ON "cart"."reservations"("expires_at");

-- CreateIndex
CREATE INDEX "shopping_carts_user_id_idx" ON "cart"."shopping_carts"("user_id");

-- CreateIndex
CREATE INDEX "shopping_carts_user_id_created_at_idx" ON "cart"."shopping_carts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "shopping_carts_guest_token_updated_at_idx" ON "cart"."shopping_carts"("guest_token", "updated_at");

-- CreateIndex
CREATE INDEX "shopping_carts_reservation_expires_at_idx" ON "cart"."shopping_carts"("reservation_expires_at");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "customer_care"."chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_type_idx" ON "customer_care"."chat_messages"("sender_type");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "customer_care"."chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_idx" ON "customer_care"."chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX "chat_sessions_agent_id_idx" ON "customer_care"."chat_sessions"("agent_id");

-- CreateIndex
CREATE INDEX "chat_sessions_status_idx" ON "customer_care"."chat_sessions"("status");

-- CreateIndex
CREATE INDEX "chat_sessions_started_at_idx" ON "customer_care"."chat_sessions"("started_at");

-- CreateIndex
CREATE INDEX "chat_sessions_agent_id_status_idx" ON "customer_care"."chat_sessions"("agent_id", "status");

-- CreateIndex
CREATE INDEX "customer_feedback_user_id_idx" ON "customer_care"."customer_feedback"("user_id");

-- CreateIndex
CREATE INDEX "customer_feedback_ticket_id_idx" ON "customer_care"."customer_feedback"("ticket_id");

-- CreateIndex
CREATE INDEX "customer_feedback_order_id_idx" ON "customer_care"."customer_feedback"("order_id");

-- CreateIndex
CREATE INDEX "customer_feedback_nps_score_idx" ON "customer_care"."customer_feedback"("nps_score");

-- CreateIndex
CREATE INDEX "customer_feedback_csat_score_idx" ON "customer_care"."customer_feedback"("csat_score");

-- CreateIndex
CREATE INDEX "customer_feedback_created_at_idx" ON "customer_care"."customer_feedback"("created_at");

-- CreateIndex
CREATE INDEX "goodwill_records_user_id_idx" ON "customer_care"."goodwill_records"("user_id");

-- CreateIndex
CREATE INDEX "goodwill_records_order_id_idx" ON "customer_care"."goodwill_records"("order_id");

-- CreateIndex
CREATE INDEX "goodwill_records_type_idx" ON "customer_care"."goodwill_records"("type");

-- CreateIndex
CREATE INDEX "goodwill_records_created_at_idx" ON "customer_care"."goodwill_records"("created_at");

-- CreateIndex
CREATE INDEX "repairs_order_item_id_idx" ON "customer_care"."repairs"("order_item_id");

-- CreateIndex
CREATE INDEX "repairs_status_idx" ON "customer_care"."repairs"("status");

-- CreateIndex
CREATE INDEX "return_items_order_item_id_idx" ON "customer_care"."return_items"("order_item_id");

-- CreateIndex
CREATE INDEX "return_items_condition_idx" ON "customer_care"."return_items"("condition");

-- CreateIndex
CREATE INDEX "return_items_disposition_idx" ON "customer_care"."return_items"("disposition");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "customer_care"."return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_type_idx" ON "customer_care"."return_requests"("type");

-- CreateIndex
CREATE INDEX "return_requests_status_idx" ON "customer_care"."return_requests"("status");

-- CreateIndex
CREATE INDEX "return_requests_created_at_idx" ON "customer_care"."return_requests"("created_at");

-- CreateIndex
CREATE INDEX "return_requests_status_created_at_idx" ON "customer_care"."return_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "support_agents_name_idx" ON "customer_care"."support_agents"("name");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "customer_care"."support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_order_id_idx" ON "customer_care"."support_tickets"("order_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "customer_care"."support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "customer_care"."support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_source_idx" ON "customer_care"."support_tickets"("source");

-- CreateIndex
CREATE INDEX "support_tickets_created_at_idx" ON "customer_care"."support_tickets"("created_at");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_idx" ON "customer_care"."support_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "support_tickets_status_created_at_idx" ON "customer_care"."support_tickets"("status", "created_at");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_idx" ON "customer_care"."ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_messages_sender_idx" ON "customer_care"."ticket_messages"("sender");

-- CreateIndex
CREATE INDEX "ticket_messages_created_at_idx" ON "customer_care"."ticket_messages"("created_at");

-- CreateIndex
CREATE INDEX "appointments_user_id_idx" ON "engagement"."appointments"("user_id");

-- CreateIndex
CREATE INDEX "appointments_location_id_idx" ON "engagement"."appointments"("location_id");

-- CreateIndex
CREATE INDEX "appointments_type_idx" ON "engagement"."appointments"("type");

-- CreateIndex
CREATE INDEX "appointments_start_at_idx" ON "engagement"."appointments"("start_at");

-- CreateIndex
CREATE INDEX "appointments_location_id_start_at_idx" ON "engagement"."appointments"("location_id", "start_at");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_status_idx" ON "engagement"."newsletter_subscriptions"("status");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_source_idx" ON "engagement"."newsletter_subscriptions"("source");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "engagement"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "engagement"."notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_template_id_idx" ON "engagement"."notifications"("template_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "engagement"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "engagement"."notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "engagement"."notifications"("sent_at");

-- CreateIndex
CREATE INDEX "notifications_status_scheduled_at_idx" ON "engagement"."notifications"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "product_reviews_user_id_idx" ON "engagement"."product_reviews"("user_id");

-- CreateIndex
CREATE INDEX "product_reviews_status_idx" ON "engagement"."product_reviews"("status");

-- CreateIndex
CREATE INDEX "product_reviews_rating_idx" ON "engagement"."product_reviews"("rating");

-- CreateIndex
CREATE INDEX "product_reviews_created_at_idx" ON "engagement"."product_reviews"("created_at");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_status_idx" ON "engagement"."product_reviews"("product_id", "status");

-- CreateIndex
CREATE INDEX "reminders_user_id_idx" ON "engagement"."reminders"("user_id");

-- CreateIndex
CREATE INDEX "reminders_type_idx" ON "engagement"."reminders"("type");

-- CreateIndex
CREATE INDEX "reminders_status_idx" ON "engagement"."reminders"("status");

-- CreateIndex
CREATE INDEX "reminders_opt_in_at_idx" ON "engagement"."reminders"("opt_in_at");

-- CreateIndex
CREATE INDEX "wishlist_items_variant_id_idx" ON "engagement"."wishlist_items"("variant_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "engagement"."wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlists_guest_token_idx" ON "engagement"."wishlists"("guest_token");

-- CreateIndex
CREATE INDEX "wishlists_is_default_idx" ON "engagement"."wishlists"("is_default");

-- CreateIndex
CREATE INDEX "wishlists_is_public_idx" ON "engagement"."wishlists"("is_public");

-- CreateIndex
CREATE INDEX "shipment_items_order_item_id_idx" ON "fulfillment"."shipment_items"("order_item_id");

-- CreateIndex
CREATE INDEX "shipments_carrier_idx" ON "fulfillment"."shipments"("carrier");

-- CreateIndex
CREATE INDEX "shipments_service_idx" ON "fulfillment"."shipments"("service");

-- CreateIndex
CREATE INDEX "shipments_shipped_at_idx" ON "fulfillment"."shipments"("shipped_at");

-- CreateIndex
CREATE INDEX "shipments_delivered_at_idx" ON "fulfillment"."shipments"("delivered_at");

-- CreateIndex
CREATE INDEX "shipments_updated_at_idx" ON "fulfillment"."shipments"("updated_at");

-- CreateIndex
CREATE INDEX "inventory_stocks_location_id_idx" ON "inventory_management"."inventory_stocks"("location_id");

-- CreateIndex
CREATE INDEX "inventory_stocks_on_hand_idx" ON "inventory_management"."inventory_stocks"("on_hand");

-- CreateIndex
CREATE INDEX "inventory_transactions_location_id_idx" ON "inventory_management"."inventory_transactions"("location_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_reason_idx" ON "inventory_management"."inventory_transactions"("reason");

-- CreateIndex
CREATE INDEX "inventory_transactions_reference_type_reference_id_idx" ON "inventory_management"."inventory_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "inventory_management"."locations"("type");

-- CreateIndex
CREATE INDEX "locations_name_idx" ON "inventory_management"."locations"("name");

-- CreateIndex
CREATE INDEX "pickup_reservations_order_id_idx" ON "inventory_management"."pickup_reservations"("order_id");

-- CreateIndex
CREATE INDEX "pickup_reservations_location_id_idx" ON "inventory_management"."pickup_reservations"("location_id");

-- CreateIndex
CREATE INDEX "pickup_reservations_variant_id_idx" ON "inventory_management"."pickup_reservations"("variant_id");

-- CreateIndex
CREATE INDEX "pickup_reservations_expires_at_idx" ON "inventory_management"."pickup_reservations"("expires_at");

-- CreateIndex
CREATE INDEX "purchase_order_items_variant_id_idx" ON "inventory_management"."purchase_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "inventory_management"."purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "inventory_management"."purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_eta_idx" ON "inventory_management"."purchase_orders"("eta");

-- CreateIndex
CREATE INDEX "purchase_orders_status_eta_idx" ON "inventory_management"."purchase_orders"("status", "eta");

-- CreateIndex
CREATE INDEX "stock_alerts_variant_id_idx" ON "inventory_management"."stock_alerts"("variant_id");

-- CreateIndex
CREATE INDEX "stock_alerts_type_idx" ON "inventory_management"."stock_alerts"("type");

-- CreateIndex
CREATE INDEX "stock_alerts_triggered_at_idx" ON "inventory_management"."stock_alerts"("triggered_at");

-- CreateIndex
CREATE INDEX "stock_alerts_resolved_at_idx" ON "inventory_management"."stock_alerts"("resolved_at");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "inventory_management"."suppliers"("name");

-- CreateIndex
CREATE INDEX "backorders_promised_eta_idx" ON "order_management"."backorders"("promised_eta");

-- CreateIndex
CREATE INDEX "order_events_order_id_idx" ON "order_management"."order_events"("order_id");

-- CreateIndex
CREATE INDEX "order_events_event_type_idx" ON "order_management"."order_events"("event_type");

-- CreateIndex
CREATE INDEX "order_events_created_at_idx" ON "order_management"."order_events"("created_at");

-- CreateIndex
CREATE INDEX "order_events_order_id_event_type_idx" ON "order_management"."order_events"("order_id", "event_type");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_management"."order_items"("variant_id");

-- CreateIndex
CREATE INDEX "order_shipments_order_id_idx" ON "order_management"."order_shipments"("order_id");

-- CreateIndex
CREATE INDEX "order_shipments_tracking_no_idx" ON "order_management"."order_shipments"("tracking_no");

-- CreateIndex
CREATE INDEX "order_shipments_pickup_location_id_idx" ON "order_management"."order_shipments"("pickup_location_id");

-- CreateIndex
CREATE INDEX "order_shipments_shipped_at_idx" ON "order_management"."order_shipments"("shipped_at");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_management"."order_status_history"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_changed_at_idx" ON "order_management"."order_status_history"("changed_at");

-- CreateIndex
CREATE INDEX "order_status_history_to_status_idx" ON "order_management"."order_status_history"("to_status");

-- CreateIndex
CREATE INDEX "orders_guest_token_idx" ON "order_management"."orders"("guest_token");

-- CreateIndex
CREATE INDEX "orders_payment_intent_id_idx" ON "order_management"."orders"("payment_intent_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "order_management"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_source_idx" ON "order_management"."orders"("source");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "order_management"."orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "order_management"."orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "order_management"."orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "order_management"."orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "preorders_release_date_idx" ON "order_management"."preorders"("release_date");

-- CreateIndex
CREATE INDEX "bnpl_transactions_order_id_idx" ON "payment_loyalty"."bnpl_transactions"("order_id");

-- CreateIndex
CREATE INDEX "bnpl_transactions_intent_id_idx" ON "payment_loyalty"."bnpl_transactions"("intent_id");

-- CreateIndex
CREATE INDEX "bnpl_transactions_provider_idx" ON "payment_loyalty"."bnpl_transactions"("provider");

-- CreateIndex
CREATE INDEX "bnpl_transactions_status_idx" ON "payment_loyalty"."bnpl_transactions"("status");

-- CreateIndex
CREATE INDEX "gift_card_transactions_gift_card_id_idx" ON "payment_loyalty"."gift_card_transactions"("gift_card_id");

-- CreateIndex
CREATE INDEX "gift_card_transactions_order_id_idx" ON "payment_loyalty"."gift_card_transactions"("order_id");

-- CreateIndex
CREATE INDEX "gift_card_transactions_type_idx" ON "payment_loyalty"."gift_card_transactions"("type");

-- CreateIndex
CREATE INDEX "gift_card_transactions_created_at_idx" ON "payment_loyalty"."gift_card_transactions"("created_at");

-- CreateIndex
CREATE INDEX "gift_cards_status_idx" ON "payment_loyalty"."gift_cards"("status");

-- CreateIndex
CREATE INDEX "gift_cards_expires_at_idx" ON "payment_loyalty"."gift_cards"("expires_at");

-- CreateIndex
CREATE INDEX "loyalty_accounts_user_id_idx" ON "payment_loyalty"."loyalty_accounts"("user_id");

-- CreateIndex
CREATE INDEX "loyalty_accounts_program_id_idx" ON "payment_loyalty"."loyalty_accounts"("program_id");

-- CreateIndex
CREATE INDEX "loyalty_accounts_tier_idx" ON "payment_loyalty"."loyalty_accounts"("tier");

-- CreateIndex
CREATE INDEX "loyalty_accounts_points_balance_idx" ON "payment_loyalty"."loyalty_accounts"("points_balance");

-- CreateIndex
CREATE INDEX "loyalty_programs_name_idx" ON "payment_loyalty"."loyalty_programs"("name");

-- CreateIndex
CREATE INDEX "loyalty_transactions_account_id_idx" ON "payment_loyalty"."loyalty_transactions"("account_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_order_id_idx" ON "payment_loyalty"."loyalty_transactions"("order_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_reason_idx" ON "payment_loyalty"."loyalty_transactions"("reason");

-- CreateIndex
CREATE INDEX "loyalty_transactions_created_at_idx" ON "payment_loyalty"."loyalty_transactions"("created_at");

-- CreateIndex
CREATE INDEX "payment_intents_order_id_idx" ON "payment_loyalty"."payment_intents"("order_id");

-- CreateIndex
CREATE INDEX "payment_intents_provider_idx" ON "payment_loyalty"."payment_intents"("provider");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_loyalty"."payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_client_secret_idx" ON "payment_loyalty"."payment_intents"("client_secret");

-- CreateIndex
CREATE INDEX "payment_intents_status_created_at_idx" ON "payment_loyalty"."payment_intents"("status", "created_at");

-- CreateIndex
CREATE INDEX "payment_transactions_type_idx" ON "payment_loyalty"."payment_transactions"("type");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_loyalty"."payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_psp_ref_idx" ON "payment_loyalty"."payment_transactions"("psp_ref");

-- CreateIndex
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_loyalty"."payment_transactions"("created_at");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_idx" ON "payment_loyalty"."payment_webhook_events"("provider");

-- CreateIndex
CREATE INDEX "payment_webhook_events_event_type_idx" ON "payment_loyalty"."payment_webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "payment_webhook_events_created_at_idx" ON "payment_loyalty"."payment_webhook_events"("created_at");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_event_type_idx" ON "payment_loyalty"."payment_webhook_events"("provider", "event_type");

-- CreateIndex
CREATE INDEX "promotion_usage_order_id_idx" ON "payment_loyalty"."promotion_usage"("order_id");

-- CreateIndex
CREATE INDEX "promotions_status_idx" ON "payment_loyalty"."promotions"("status");

-- CreateIndex
CREATE INDEX "promotions_starts_at_idx" ON "payment_loyalty"."promotions"("starts_at");

-- CreateIndex
CREATE INDEX "promotions_ends_at_idx" ON "payment_loyalty"."promotions"("ends_at");

-- CreateIndex
CREATE INDEX "promotions_status_starts_at_ends_at_idx" ON "payment_loyalty"."promotions"("status", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "product_catalog"."categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_position_idx" ON "product_catalog"."categories"("position");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "product_catalog"."product_categories"("category_id");

-- CreateIndex
CREATE INDEX "product_media_product_id_idx" ON "product_catalog"."product_media"("product_id");

-- CreateIndex
CREATE INDEX "product_media_asset_id_idx" ON "product_catalog"."product_media"("asset_id");

-- CreateIndex
CREATE INDEX "product_media_product_id_position_idx" ON "product_catalog"."product_media"("product_id", "position");

-- CreateIndex
CREATE INDEX "product_tag_associations_tag_id_idx" ON "product_catalog"."product_tag_associations"("tag_id");

-- CreateIndex
CREATE INDEX "product_tags_kind_idx" ON "product_catalog"."product_tags"("kind");

-- CreateIndex
CREATE INDEX "product_variants_product_id_color_idx" ON "product_catalog"."product_variants"("product_id", "color");

-- CreateIndex
CREATE INDEX "product_variants_product_id_size_idx" ON "product_catalog"."product_variants"("product_id", "size");

-- CreateIndex
CREATE INDEX "product_variants_barcode_idx" ON "product_catalog"."product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_price_idx" ON "product_catalog"."product_variants"("price");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "product_catalog"."products"("brand");

-- CreateIndex
CREATE INDEX "products_status_publish_at_idx" ON "product_catalog"."products"("status", "publish_at");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "product_catalog"."products"("created_at");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "user_management"."payment_methods"("user_id");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_is_default_idx" ON "user_management"."payment_methods"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "payment_methods_billing_address_id_idx" ON "user_management"."payment_methods"("billing_address_id");

-- CreateIndex
CREATE INDEX "payment_methods_provider_ref_idx" ON "user_management"."payment_methods"("provider_ref");

-- CreateIndex
CREATE INDEX "social_logins_user_id_idx" ON "user_management"."social_logins"("user_id");

-- CreateIndex
CREATE INDEX "social_logins_provider_idx" ON "user_management"."social_logins"("provider");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "user_management"."user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_is_default_idx" ON "user_management"."user_addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "user_addresses_country_idx" ON "user_management"."user_addresses"("country");

-- CreateIndex
CREATE INDEX "user_addresses_type_idx" ON "user_management"."user_addresses"("type");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "user_management"."users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "user_management"."users"("role");

-- CreateIndex
CREATE INDEX "users_is_guest_idx" ON "user_management"."users"("is_guest");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "user_management"."users"("created_at");

-- CreateIndex
CREATE INDEX "users_status_role_idx" ON "user_management"."users"("status", "role");

-- CreateIndex
CREATE INDEX "users_email_verified_idx" ON "user_management"."users"("email_verified");
