-- AlterTable - Add columns if they don't exist
ALTER TABLE "tenant_settings" ADD COLUMN IF NOT EXISTS "chatwoot_url" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN IF NOT EXISTS "chatwoot_account_id" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN IF NOT EXISTS "chatwoot_api_token" TEXT;
