-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "waha_host" TEXT NOT NULL DEFAULT '',
    "waha_api_key" TEXT NOT NULL DEFAULT '',
    "evolution_host" TEXT NOT NULL DEFAULT '',
    "evolution_api_key" TEXT NOT NULL DEFAULT '',
    "company_name" TEXT,
    "page_title" TEXT,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "global_settings_singleton_key" UNIQUE ("singleton")
);
