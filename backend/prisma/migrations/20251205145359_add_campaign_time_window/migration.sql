/*
  Warnings:

  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `quepasa_url` on table `global_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quepasa_login` on table `global_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quepasa_password` on table `global_settings` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CAMPAIGN', 'BACKUP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('WEBHOOK', 'ZAPIER', 'CRM', 'ERP', 'ECOMMERCE', 'EMAIL', 'CALENDAR', 'STORAGE', 'ANALYTICS', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_session_name_fkey";

-- AlterTable
ALTER TABLE "campaign_messages" ADD COLUMN     "selected_variation" TEXT;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "start_time" TEXT,
ADD COLUMN     "use_time_window" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "session_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "global_settings" ALTER COLUMN "quepasa_url" SET NOT NULL,
ALTER COLUMN "quepasa_url" SET DEFAULT '',
ALTER COLUMN "quepasa_login" SET NOT NULL,
ALTER COLUMN "quepasa_login" SET DEFAULT '',
ALTER COLUMN "quepasa_password" SET NOT NULL,
ALTER COLUMN "quepasa_password" SET DEFAULT '';

-- DropTable
DROP TABLE "settings";

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "media_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "credentials" JSONB,
    "webhook_url" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_syncs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "records_count" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "integration_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_user_id_read_idx" ON "user_notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "user_notifications_created_at_idx" ON "user_notifications"("created_at");

-- CreateIndex
CREATE INDEX "message_templates_tenant_id_idx" ON "message_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX "message_templates_message_type_idx" ON "message_templates"("message_type");

-- CreateIndex
CREATE INDEX "message_templates_active_idx" ON "message_templates"("active");

-- CreateIndex
CREATE INDEX "integrations_tenant_id_idx" ON "integrations"("tenant_id");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "integrations_active_idx" ON "integrations"("active");

-- CreateIndex
CREATE INDEX "integration_syncs_integration_id_idx" ON "integration_syncs"("integration_id");

-- CreateIndex
CREATE INDEX "integration_syncs_started_at_idx" ON "integration_syncs"("started_at");

-- CreateIndex
CREATE INDEX "integration_syncs_status_idx" ON "integration_syncs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_timestamp_idx" ON "audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_session_name_fkey" FOREIGN KEY ("session_name") REFERENCES "whatsapp_sessions"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_syncs" ADD CONSTRAINT "integration_syncs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
