-- Migration: Adicionar tabela sso_tokens
-- Descrição: Armazena tokens SSO temporários para acesso direto a ISOs
-- Benefício: Permite SSO funcionar em produção com múltiplas instâncias e reinicializações

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sso_tokens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "sso_tokens_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"token" varchar(255) NOT NULL,
	"user_id" bigint NOT NULL,
	"customer_id" bigint NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"used" boolean DEFAULT false,
	CONSTRAINT "sso_tokens_token_key" UNIQUE("token")
);

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sso_tokens" ADD CONSTRAINT "sso_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sso_tokens" ADD CONSTRAINT "sso_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sso_tokens_token_idx" ON "sso_tokens" ("token");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sso_tokens_expires_at_idx" ON "sso_tokens" ("expires_at");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sso_tokens_used_idx" ON "sso_tokens" ("used");

