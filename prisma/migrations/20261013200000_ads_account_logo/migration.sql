-- AlterTable
ALTER TABLE "ads_accounts" ADD COLUMN     "logo" BYTEA,
ADD COLUMN     "logo_type" VARCHAR(20),
ADD COLUMN     "logo_updated_at" TIMESTAMPTZ;
