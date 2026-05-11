-- CreateTable
CREATE TABLE "user_management"."member_sessions" (
    "session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_sessions_refresh_token_hash_key" ON "user_management"."member_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "member_sessions_user_id_idx" ON "user_management"."member_sessions"("user_id");

-- CreateIndex
CREATE INDEX "member_sessions_user_id_is_revoked_idx" ON "user_management"."member_sessions"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "member_sessions_expires_at_idx" ON "user_management"."member_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "user_management"."member_sessions" ADD CONSTRAINT "member_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_management"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
