-- Loyalty balances are now persisted as atomic increments (concurrent earning
-- and redeeming add up instead of overwriting each other). This constraint is
-- the final guard: a redemption that concurrent activity has made impossible
-- is refused by the database instead of driving the balance negative.
--
-- Added NOT VALID (enforced for new writes immediately), then validated
-- against existing rows; if historical rows already violate it, validation is
-- skipped with a warning instead of failing the deployment.

ALTER TABLE "payment_loyalty"."loyalty_accounts"
  ADD CONSTRAINT "loyalty_accounts_current_balance_non_negative" CHECK ("current_balance" >= 0) NOT VALID;

DO $$
BEGIN
  ALTER TABLE "payment_loyalty"."loyalty_accounts" VALIDATE CONSTRAINT "loyalty_accounts_current_balance_non_negative";
EXCEPTION WHEN check_violation THEN
  RAISE WARNING 'loyalty_accounts contains negative balances; the constraint is enforced for new writes only until those rows are fixed and validated';
END $$;
