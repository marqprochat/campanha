-- AlterTable
ALTER TABLE "whatsapp_sessions" ADD COLUMN "tenant_id" TEXT;

-- CreateIndex
CREATE INDEX "whatsapp_sessions_tenant_id_idx" ON "whatsapp_sessions"("tenant_id");

-- AddForeignKey
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
