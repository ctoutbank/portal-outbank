-- =====================================================
-- Script SQL para adicionar campos de antecipação compulsória
-- na tabela merchant_transaction_price
-- =====================================================
-- Descrição: Adiciona campos cardCompulsoryAnticipationMdr e 
--            noCardCompulsoryAnticipationMdr que existem no Outbank-One
-- Data: 2025-01-XX
-- =====================================================

-- Verificar se os campos já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar card_compulsory_anticipation_mdr se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_transaction_price' 
        AND column_name = 'card_compulsory_anticipation_mdr'
    ) THEN
        ALTER TABLE "merchant_transaction_price" 
        ADD COLUMN "card_compulsory_anticipation_mdr" numeric;
        
        RAISE NOTICE 'Campo card_compulsory_anticipation_mdr adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo card_compulsory_anticipation_mdr já existe';
    END IF;

    -- Adicionar no_card_compulsory_anticipation_mdr se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'merchant_transaction_price' 
        AND column_name = 'no_card_compulsory_anticipation_mdr'
    ) THEN
        ALTER TABLE "merchant_transaction_price" 
        ADD COLUMN "no_card_compulsory_anticipation_mdr" numeric;
        
        RAISE NOTICE 'Campo no_card_compulsory_anticipation_mdr adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Campo no_card_compulsory_anticipation_mdr já existe';
    END IF;
END $$;

-- Verificar se os campos foram adicionados
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'merchant_transaction_price'
    AND column_name IN (
        'card_compulsory_anticipation_mdr',
        'no_card_compulsory_anticipation_mdr'
    )
ORDER BY column_name;


