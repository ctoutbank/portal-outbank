-- Add initial_password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_password TEXT;
