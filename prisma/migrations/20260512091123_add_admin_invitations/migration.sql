-- CreateEnum
CREATE TYPE "user_management"."invitation_status_enum" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateTable
CREATE TABLE "user_management"."admin_invitations" (
    "invitation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "role" "user_management"."user_role_enum" NOT NULL DEFAULT 'ADMIN',
    "token_hash" TEXT NOT NULL,
    "status" "user_management"."invitation_status_enum" NOT NULL DEFAULT 'pending',
    "invited_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_token_hash_key" ON "user_management"."admin_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "admin_invitations_email_idx" ON "user_management"."admin_invitations"("email");

-- CreateIndex
CREATE INDEX "admin_invitations_status_idx" ON "user_management"."admin_invitations"("status");

-- CreateIndex
CREATE INDEX "admin_invitations_expires_at_idx" ON "user_management"."admin_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "admin_invitations_invited_by_id_idx" ON "user_management"."admin_invitations"("invited_by_id");

-- AddForeignKey
ALTER TABLE "user_management"."admin_invitations" ADD CONSTRAINT "admin_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user_management"."users"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;
