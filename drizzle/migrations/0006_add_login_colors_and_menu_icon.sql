-- Migration: Adicionar campos de cores de login e ícone do menu
-- Data: 2026-01-09
-- Descrição: Adiciona campos para personalização de cores da tela de login
--            e campo para ícone do menu/sidebar (36x36px)

-- Adicionar campos de cores do login
ALTER TABLE customer_customization 
ADD COLUMN IF NOT EXISTS login_button_color VARCHAR(100),
ADD COLUMN IF NOT EXISTS login_button_text_color VARCHAR(100),
ADD COLUMN IF NOT EXISTS login_title_color VARCHAR(100),
ADD COLUMN IF NOT EXISTS login_text_color VARCHAR(100);

-- Adicionar campos de ícone do menu (36x36px)
ALTER TABLE customer_customization 
ADD COLUMN IF NOT EXISTS menu_icon_url VARCHAR(100),
ADD COLUMN IF NOT EXISTS menu_icon_file_id BIGINT;

-- Comentários para documentação
COMMENT ON COLUMN customer_customization.login_button_color IS 'Cor do botão de login (formato HSL)';
COMMENT ON COLUMN customer_customization.login_button_text_color IS 'Cor do texto do botão de login (formato HSL)';
COMMENT ON COLUMN customer_customization.login_title_color IS 'Cor do título na tela de login (formato HSL)';
COMMENT ON COLUMN customer_customization.login_text_color IS 'Cor do texto na tela de login (formato HSL)';
COMMENT ON COLUMN customer_customization.menu_icon_url IS 'URL do ícone do menu/sidebar (36x36px)';
COMMENT ON COLUMN customer_customization.menu_icon_file_id IS 'ID do arquivo do ícone do menu';
