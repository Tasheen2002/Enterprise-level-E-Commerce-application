-- Stock levels are now persisted as atomic increments (concurrent changes add
-- up instead of overwriting each other). These constraints are the final
-- guard: a change that concurrent activity has made impossible (overselling,
-- negative stock, reserving more than is on hand) is rejected by the database.
--
-- Added NOT VALID so they are enforced on every new write immediately, then
-- validated against existing rows. If historical rows already violate them,
-- validation is skipped with a warning instead of failing the deployment;
-- fix those rows and run VALIDATE CONSTRAINT manually.

ALTER TABLE "inventory_management"."inventory_stocks"
  ADD CONSTRAINT "inventory_stocks_on_hand_non_negative" CHECK ("on_hand" >= 0) NOT VALID;
ALTER TABLE "inventory_management"."inventory_stocks"
  ADD CONSTRAINT "inventory_stocks_reserved_non_negative" CHECK ("reserved" >= 0) NOT VALID;
ALTER TABLE "inventory_management"."inventory_stocks"
  ADD CONSTRAINT "inventory_stocks_reserved_within_on_hand" CHECK ("reserved" <= "on_hand") NOT VALID;

DO $$
BEGIN
  ALTER TABLE "inventory_management"."inventory_stocks" VALIDATE CONSTRAINT "inventory_stocks_on_hand_non_negative";
  ALTER TABLE "inventory_management"."inventory_stocks" VALIDATE CONSTRAINT "inventory_stocks_reserved_non_negative";
  ALTER TABLE "inventory_management"."inventory_stocks" VALIDATE CONSTRAINT "inventory_stocks_reserved_within_on_hand";
EXCEPTION WHEN check_violation THEN
  RAISE WARNING 'inventory_stocks contains rows that violate the new stock constraints; they are enforced for new writes only until those rows are fixed and validated';
END $$;
