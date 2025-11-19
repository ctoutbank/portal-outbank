-- Create admin_customers table to track which ISOs each Admin can manage
CREATE TABLE IF NOT EXISTS admin_customers (
	id BIGSERIAL PRIMARY KEY,
	slug VARCHAR(50),
	dtinsert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	dtupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	active BOOLEAN DEFAULT true,
	id_user BIGINT NOT NULL,
	id_customer BIGINT NOT NULL,
	CONSTRAINT admin_customers_id_user_fkey FOREIGN KEY (id_user) REFERENCES users(id),
	CONSTRAINT admin_customers_id_customer_fkey FOREIGN KEY (id_customer) REFERENCES customers(id),
	CONSTRAINT admin_customers_id_user_id_customer_key UNIQUE (id_user, id_customer)
);

CREATE SEQUENCE IF NOT EXISTS admin_customers_id_seq
	START WITH 1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	CACHE 1;

ALTER TABLE admin_customers 
	ALTER COLUMN id SET DEFAULT nextval('admin_customers_id_seq');

