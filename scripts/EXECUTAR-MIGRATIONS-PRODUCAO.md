# Executar Migrations no Banco de Produção (Vercel/Neon)

## Problema
A tabela `admin_customers` não existe no banco de dados de produção, causando erro:
```
Error [NeonDbError]: relation "admin_customers" does not exist
```

## Solução

### Opção 1: Executar via Neon Console (Recomendado)

1. Acesse o [Neon Console](https://console.neon.tech/)
2. Selecione seu projeto
3. Vá para a aba "SQL Editor"
4. Execute o script `scripts/criar-admin-customers-tabela.sql`
5. Verifique se a tabela foi criada corretamente

### Opção 2: Executar via Drizzle Kit (Se configurado)

Se você tiver Drizzle Kit configurado para produção:

```bash
# Verificar conexão com banco de produção
npx drizzle-kit push --config=drizzle.config.ts

# Ou executar migrations específicas
npx drizzle-kit migrate --config=drizzle.config.ts
```

### Opção 3: Executar via psql (Linha de comando)

Se você tiver acesso ao banco via psql:

```bash
psql "postgresql://[CONNECTION_STRING]" -f scripts/criar-admin-customers-tabela.sql
```

## Migrations Pendentes

### 1. Tabela admin_customers (0002)
- **Arquivo**: `scripts/criar-admin-customers-tabela.sql`
- **Descrição**: Cria a tabela para rastrear quais ISOs cada Admin pode gerenciar
- **Status**: ⚠️ **PENDENTE**

### 2. Coluna restrict_customer_data em profiles (0003)
- **Arquivo**: `drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql`
- **Descrição**: Adiciona coluna para restringir acesso a dados sensíveis
- **Status**: ⚠️ **PENDENTE**

## Verificação

Após executar a migration, verifique se a tabela foi criada:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'admin_customers';

-- Verificar estrutura da tabela
\d admin_customers
-- ou
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;
```

## Importante

⚠️ **Execute primeiro a migration 0002 (admin_customers)** antes de executar a 0003, caso ainda não tenha executado.





