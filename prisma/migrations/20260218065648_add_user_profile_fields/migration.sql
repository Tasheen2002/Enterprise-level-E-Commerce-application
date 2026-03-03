/*
  Warnings:

  - The values [STAFF] on the enum `user_role_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "user_management"."user_role_enum_new" AS ENUM ('GUEST', 'CUSTOMER', 'ADMIN', 'INVENTORY_STAFF', 'CUSTOMER_SERVICE', 'ANALYST', 'VENDOR');
ALTER TABLE "user_management"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user_management"."users" ALTER COLUMN "role" TYPE "user_management"."user_role_enum_new" USING ("role"::text::"user_management"."user_role_enum_new");
ALTER TYPE "user_management"."user_role_enum" RENAME TO "user_role_enum_old";
ALTER TYPE "user_management"."user_role_enum_new" RENAME TO "user_role_enum";
DROP TYPE "user_management"."user_role_enum_old";
ALTER TABLE "user_management"."users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- AlterTable
ALTER TABLE "user_management"."users" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "resident_of" TEXT,
ADD COLUMN     "title" TEXT;
