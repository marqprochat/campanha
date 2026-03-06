-- Add cpfCnpj field to tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "cpf_cnpj" TEXT;
