-- AlterTable
ALTER TABLE "campaign_messages" ADD COLUMN "tenant_id" TEXT;

-- CreateIndex
CREATE INDEX "campaign_messages_tenant_id_idx" ON "campaign_messages"("tenant_id");

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
