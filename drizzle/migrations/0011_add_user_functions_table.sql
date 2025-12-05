-- Migration: Add user_functions table
-- Description: Creates table for individual user permissions beyond category-based permissions
-- Date: 2024-12-05

-- Create user_functions table
CREATE TABLE IF NOT EXISTS "user_functions" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "slug" varchar(50),
  "dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
  "dtupdate" timestamp,
  "active" boolean DEFAULT true,
  "id_user" bigint NOT NULL,
  "id_functions" bigint NOT NULL,
  
  -- Foreign key constraints
  CONSTRAINT "user_functions_id_user_fkey" 
    FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_functions_id_functions_fkey" 
    FOREIGN KEY ("id_functions") REFERENCES "functions"("id") ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate permissions for same user
  CONSTRAINT "user_functions_unique" 
    UNIQUE ("id_user", "id_functions")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "user_functions_id_user_idx" ON "user_functions"("id_user");
CREATE INDEX IF NOT EXISTS "user_functions_id_functions_idx" ON "user_functions"("id_functions");
CREATE INDEX IF NOT EXISTS "user_functions_active_idx" ON "user_functions"("active");

-- Comment on table
COMMENT ON TABLE "user_functions" IS 'Stores individual user permissions that complement category-based permissions (profile_functions). Super Admin can assign these permissions directly to users.';

-- Comment on columns
COMMENT ON COLUMN "user_functions"."id_user" IS 'References the user who has this individual permission';
COMMENT ON COLUMN "user_functions"."id_functions" IS 'References the function/permission being granted';
COMMENT ON COLUMN "user_functions"."active" IS 'Soft delete flag - false means permission is revoked';

