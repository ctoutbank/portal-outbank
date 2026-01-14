-- Migration: Add index on users.email for faster login queries
-- This index significantly improves login performance by avoiding full table scans

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
