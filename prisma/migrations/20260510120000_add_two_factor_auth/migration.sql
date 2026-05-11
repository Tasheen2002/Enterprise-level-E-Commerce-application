-- Two-factor authentication: store the TOTP secret + enabled flag on
-- the user, and a separate table for one-time backup codes (hashed).

ALTER TABLE "user_management"."users"
  ADD COLUMN "two_factor_secret" TEXT,
  ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "user_management"."two_factor_backup_codes" (
  "backup_code_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "code_hash" TEXT NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "two_factor_backup_codes_pkey" PRIMARY KEY ("backup_code_id")
);

CREATE INDEX "two_factor_backup_codes_user_id_idx"
  ON "user_management"."two_factor_backup_codes" ("user_id");

-- Hot path during login: "find any unused code for this user". Composite
-- index makes the (user, used_at IS NULL) lookup an index-only scan.
CREATE INDEX "two_factor_backup_codes_user_id_used_at_idx"
  ON "user_management"."two_factor_backup_codes" ("user_id", "used_at");

ALTER TABLE "user_management"."two_factor_backup_codes"
  ADD CONSTRAINT "two_factor_backup_codes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_management"."users" ("user_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
