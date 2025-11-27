-- CreateTable
CREATE TABLE "automation_flows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenant_id" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "context" JSONB,
    "error" TEXT,
    "duration" INTEGER,

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_flows_tenant_id_idx" ON "automation_flows"("tenant_id");

-- CreateIndex
CREATE INDEX "automation_flows_active_idx" ON "automation_flows"("active");

-- CreateIndex
CREATE INDEX "automation_executions_flow_id_idx" ON "automation_executions"("flow_id");

-- CreateIndex
CREATE INDEX "automation_executions_executed_at_idx" ON "automation_executions"("executed_at");

-- CreateIndex
CREATE INDEX "automation_executions_status_idx" ON "automation_executions"("status");

-- AddForeignKey
ALTER TABLE "automation_flows" ADD CONSTRAINT "automation_flows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_flows" ADD CONSTRAINT "automation_flows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "automation_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
