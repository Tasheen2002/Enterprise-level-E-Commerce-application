-- One review per customer and product. The service already refuses a second
-- review, but two simultaneous submissions could both pass that check; the
-- unique index makes the database keep only one.
--
-- If historical duplicates exist, index creation is skipped with a warning
-- instead of failing the deployment; remove the duplicates and re-run.

DO $$
BEGIN
  CREATE UNIQUE INDEX "product_reviews_user_id_product_id_key"
    ON "engagement"."product_reviews" ("user_id", "product_id");
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'product_reviews has duplicate reviews per customer and product; the unique index was not created until they are removed';
END $$;
