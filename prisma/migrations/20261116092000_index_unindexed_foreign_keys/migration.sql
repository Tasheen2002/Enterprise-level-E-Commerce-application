-- Index foreign-key columns that had no supporting index. Without them, deleting
-- the parent row (cascade / set null) scans the child table, and the catalog
-- lookups by product, hero asset and media asset cannot use an index.

-- CreateIndex
CREATE INDEX "editorial_look_products_product_id_idx" ON "product_catalog"."editorial_look_products"("product_id");

-- CreateIndex
CREATE INDEX "editorial_looks_hero_asset_id_idx" ON "product_catalog"."editorial_looks"("hero_asset_id");

-- CreateIndex
CREATE INDEX "variant_media_asset_id_idx" ON "product_catalog"."variant_media"("asset_id");

-- CreateIndex
CREATE INDEX "user_profiles_default_address_id_idx" ON "user_management"."user_profiles"("default_address_id");

-- CreateIndex
CREATE INDEX "user_profiles_default_payment_method_id_idx" ON "user_management"."user_profiles"("default_payment_method_id");

