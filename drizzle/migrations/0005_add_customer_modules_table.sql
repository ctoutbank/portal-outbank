-- Migration: Adicionar tabela customer_modules
-- Descrição: Relaciona ISOs (customers) com módulos disponíveis
-- Benefício: Permite identificar quais módulos cada ISO possui acesso

CREATE TABLE IF NOT EXISTS "customer_modules" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "customer_modules_id_seq" 
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
	"id_customer" bigint NOT NULL,
	"id_module" bigint NOT NULL,
	CONSTRAINT "customer_modules_id_customer_fkey" 
		FOREIGN KEY ("id_customer") 
		REFERENCES "public"."customers"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "customer_modules_id_module_fkey" 
		FOREIGN KEY ("id_module") 
		REFERENCES "public"."modules"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "customer_modules_unique" 
		UNIQUE ("id_customer", "id_module")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "customer_modules_id_customer_idx" ON "customer_modules"("id_customer");
CREATE INDEX IF NOT EXISTS "customer_modules_id_module_idx" ON "customer_modules"("id_module");
CREATE INDEX IF NOT EXISTS "customer_modules_active_idx" ON "customer_modules"("active");

-- Comentários para documentação
COMMENT ON TABLE "customer_modules" IS 'Relaciona ISOs (customers) com módulos disponíveis. Permite identificar quais módulos cada ISO possui acesso.';
COMMENT ON COLUMN "customer_modules"."id_customer" IS 'ID do ISO (customer)';
COMMENT ON COLUMN "customer_modules"."id_module" IS 'ID do módulo (ADQ, BNK, C&C, FIN)';
COMMENT ON COLUMN "customer_modules"."active" IS 'Indica se o vínculo está ativo (soft delete)';

