-- Remove domain column from tenants table if it exists
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "domain";