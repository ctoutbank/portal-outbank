-- Add email_image_url and email_image_file_id columns to customer_customization table
ALTER TABLE customer_customization ADD COLUMN IF NOT EXISTS email_image_url varchar(100);
ALTER TABLE customer_customization ADD COLUMN IF NOT EXISTS email_image_file_id bigint;

