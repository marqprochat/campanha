-- RenameColumn
ALTER TABLE "tenants" RENAME COLUMN "stripe_customer_id" TO "asaas_customer_id";

-- DropColumn (Plan: stripe_product_id, stripe_price_id)
ALTER TABLE "plans" DROP COLUMN IF EXISTS "stripe_product_id";
ALTER TABLE "plans" DROP COLUMN IF EXISTS "stripe_price_id";

-- RenameColumn (Subscription)
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "asaas_subscription_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "asaas_customer_id";

-- RenameIndex
ALTER INDEX IF EXISTS "subscriptions_stripe_subscription_id_key" RENAME TO "subscriptions_asaas_subscription_id_key";

-- AddColumn (GlobalSettings: Asaas config)
ALTER TABLE "global_settings" ADD COLUMN "asaas_api_key" TEXT;
ALTER TABLE "global_settings" ADD COLUMN "asaas_webhook_token" TEXT;
ALTER TABLE "global_settings" ADD COLUMN "asaas_sandbox" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "global_settings" ADD COLUMN "asaas_billing_type" TEXT NOT NULL DEFAULT 'UNDEFINED';
ALTER TABLE "global_settings" ADD COLUMN "asaas_fine_value" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "global_settings" ADD COLUMN "asaas_interest_value" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "global_settings" ADD COLUMN "asaas_days_before_due_date" INTEGER NOT NULL DEFAULT 0;
