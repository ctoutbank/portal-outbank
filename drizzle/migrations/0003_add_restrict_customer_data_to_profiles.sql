-- Migration: Adicionar coluna restrict_customer_data em profiles
-- Permite restringir acesso a dados sensíveis (CPF, CNPJ, email, telefone) para categorias específicas

ALTER TABLE "profiles" 
ADD COLUMN "restrict_customer_data" boolean DEFAULT false;

-- Super Admin nunca tem restrição (atualizar se existir)
UPDATE "profiles" 
SET "restrict_customer_data" = false 
WHERE UPPER("name") LIKE '%SUPER%';

-- Comentário na coluna
COMMENT ON COLUMN "profiles"."restrict_customer_data" IS 'Quando true, usuários desta categoria terão CPF, CNPJ, email e telefone mascarados. Nome fantasia, razão social, cidade e estado sempre visíveis.';




