-- CreateTable
CREATE TABLE "lead_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#000000',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "background_image_url" TEXT,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_pages_slug_key" ON "lead_pages"("slug");

-- CreateIndex
CREATE INDEX "lead_pages_tenant_id_idx" ON "lead_pages"("tenant_id");

-- AddForeignKey
ALTER TABLE "lead_pages" ADD CONSTRAINT "lead_pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_pages" ADD CONSTRAINT "lead_pages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
