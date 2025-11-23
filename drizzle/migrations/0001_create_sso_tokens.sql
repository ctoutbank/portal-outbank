-- Create sso_tokens table for SSO token storage
CREATE TABLE IF NOT EXISTS "sso_tokens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sso_tokens_id_seq" start with 1 increment by 1 minvalue 1 maxvalue 9223372036854775807 cache 1),
	"token" varchar(255) NOT NULL UNIQUE,
	"user_id" bigint NOT NULL,
	"customer_id" bigint NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"used" boolean DEFAULT false
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "sso_tokens" ADD CONSTRAINT "sso_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sso_tokens" ADD CONSTRAINT "sso_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS "sso_tokens_token_idx" ON "sso_tokens" ("token");

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS "sso_tokens_expires_at_idx" ON "sso_tokens" ("expires_at");

-- Create index on used for cleanup queries
CREATE INDEX IF NOT EXISTS "sso_tokens_used_idx" ON "sso_tokens" ("used");

