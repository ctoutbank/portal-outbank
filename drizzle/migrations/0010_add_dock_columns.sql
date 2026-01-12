
-- 1. CORREÇÃO DA TABELA MCC_GROUPS (Adicionar code)
ALTER TABLE "mcc_groups" ADD COLUMN IF NOT EXISTS "code" varchar(10);

-- Preencher code para registros existentes
UPDATE "mcc_groups" SET "code" = "id"::varchar WHERE "code" IS NULL;

-- Adicionar constraints em mcc_groups
DO $$ BEGIN
 ALTER TABLE "mcc_groups" ADD CONSTRAINT "mcc_groups_code_unique" UNIQUE("code");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


-- 2. CORREÇÃO DA TABELA MCC (Adicionar colunas de integração)
ALTER TABLE "mcc" ADD COLUMN IF NOT EXISTS "mcc_group_id" varchar(10);
ALTER TABLE "mcc" ADD COLUMN IF NOT EXISTS "availability_date" varchar(50);
ALTER TABLE "mcc" ADD COLUMN IF NOT EXISTS "database_operation" varchar(10);

-- NOTA: availability_date e database_operation já existem em mcc_groups (verificado), então ignoramos aqui ou tentamos adicionar IF NOT EXISTS.
ALTER TABLE "mcc_groups" ADD COLUMN IF NOT EXISTS "availability_date" varchar(50);
ALTER TABLE "mcc_groups" ADD COLUMN IF NOT EXISTS "database_operation" varchar(10);
