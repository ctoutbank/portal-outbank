-- Migration: Adicionar tabela merchant_modules
-- Descrição: Relaciona ECs/Correntistas (merchants) com módulos e gerencia consentimento LGPD
-- Benefício: Permite rastrear quais módulos cada cliente final tem autorização e consentimento LGPD

CREATE TABLE IF NOT EXISTS "merchant_modules" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "merchant_modules_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"id_merchant" bigint NOT NULL,
	"id_module" bigint NOT NULL,
	"id_customer" bigint NOT NULL,
	
	-- Status do consentimento LGPD
	"consent_given" boolean DEFAULT false,
	"consent_date" timestamp,
	"consent_ip" varchar(50),
	"consent_user_agent" text,
	
	-- Status do acesso
	"active" boolean DEFAULT false,
	"notified" boolean DEFAULT false,
	
	CONSTRAINT "merchant_modules_id_merchant_fkey" 
		FOREIGN KEY ("id_merchant") 
		REFERENCES "public"."merchants"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "merchant_modules_id_module_fkey" 
		FOREIGN KEY ("id_module") 
		REFERENCES "public"."modules"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "merchant_modules_id_customer_fkey" 
		FOREIGN KEY ("id_customer") 
		REFERENCES "public"."customers"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "merchant_modules_unique" 
		UNIQUE ("id_merchant", "id_module")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "merchant_modules_id_merchant_idx" ON "merchant_modules"("id_merchant");
CREATE INDEX IF NOT EXISTS "merchant_modules_id_module_idx" ON "merchant_modules"("id_module");
CREATE INDEX IF NOT EXISTS "merchant_modules_id_customer_idx" ON "merchant_modules"("id_customer");
CREATE INDEX IF NOT EXISTS "merchant_modules_consent_given_idx" ON "merchant_modules"("consent_given");
CREATE INDEX IF NOT EXISTS "merchant_modules_active_idx" ON "merchant_modules"("active");
CREATE INDEX IF NOT EXISTS "merchant_modules_notified_idx" ON "merchant_modules"("notified");

-- Comentários para documentação
COMMENT ON TABLE "merchant_modules" IS 'Relaciona ECs/Correntistas (merchants) com módulos e gerencia consentimento LGPD. Permite rastrear quais módulos cada cliente final tem autorização.';
COMMENT ON COLUMN "merchant_modules"."id_merchant" IS 'ID do EC/Correntista (merchant)';
COMMENT ON COLUMN "merchant_modules"."id_module" IS 'ID do módulo (ADQ, BNK, C&C, FIN)';
COMMENT ON COLUMN "merchant_modules"."id_customer" IS 'ID do ISO (customer)';
COMMENT ON COLUMN "merchant_modules"."consent_given" IS 'Indica se o cliente final deu consentimento LGPD para o módulo';
COMMENT ON COLUMN "merchant_modules"."consent_date" IS 'Data do consentimento LGPD';
COMMENT ON COLUMN "merchant_modules"."consent_ip" IS 'IP do consentimento (auditoria)';
COMMENT ON COLUMN "merchant_modules"."consent_user_agent" IS 'User Agent do consentimento (auditoria)';
COMMENT ON COLUMN "merchant_modules"."active" IS 'Indica se o cliente final tem acesso ativo ao módulo';
COMMENT ON COLUMN "merchant_modules"."notified" IS 'Indica se o cliente final já foi notificado sobre o novo módulo';


