-- Provider user ids are only unique within one provider, so uniqueness moves
-- from provider_user_id alone to (provider, provider_user_id). The composite
-- key is weaker, so existing rows always satisfy it. It is created before the
-- old index is dropped so uniqueness is enforced throughout. The plain
-- provider index is redundant with the new key's leading column.

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "social_logins_provider_provider_user_id_key" ON "user_management"."social_logins"("provider", "provider_user_id");

-- DropIndex
DROP INDEX IF EXISTS "user_management"."social_logins_provider_user_id_key";

-- DropIndex
DROP INDEX IF EXISTS "user_management"."social_logins_provider_idx";
