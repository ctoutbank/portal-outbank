-- Migration: Adicionar tabela profile_customers
-- Descrição: Permite vincular ISOs diretamente às categorias (profiles)
-- Benefício: Usuários herdam automaticamente os ISOs configurados em sua categoria

CREATE TABLE IF NOT EXISTS "profile_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "profile_customers_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	"id_profile" bigint NOT NULL,
	"id_customer" bigint NOT NULL,
	CONSTRAINT "profile_customers_id_profile_fkey" 
		FOREIGN KEY ("id_profile") 
		REFERENCES "public"."profiles"("id") 
		ON DELETE no action 
		ON UPDATE no action,
	CONSTRAINT "profile_customers_id_customer_fkey" 
		FOREIGN KEY ("id_customer") 
		REFERENCES "public"."customers"("id") 
		ON DELETE no action 
		ON UPDATE no action,
	CONSTRAINT "profile_customers_unique" 
		UNIQUE ("id_profile", "id_customer")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "profile_customers_id_profile_idx" ON "profile_customers"("id_profile");
CREATE INDEX IF NOT EXISTS "profile_customers_id_customer_idx" ON "profile_customers"("id_customer");
CREATE INDEX IF NOT EXISTS "profile_customers_active_idx" ON "profile_customers"("active");

-- Comentários para documentação
COMMENT ON TABLE "profile_customers" IS 'Vincula ISOs (customers) a categorias (profiles). Usuários herdam automaticamente os ISOs configurados em sua categoria.';
COMMENT ON COLUMN "profile_customers"."id_profile" IS 'ID da categoria (profile)';
COMMENT ON COLUMN "profile_customers"."id_customer" IS 'ID do ISO (customer)';
COMMENT ON COLUMN "profile_customers"."active" IS 'Indica se o vínculo está ativo (soft delete)';



