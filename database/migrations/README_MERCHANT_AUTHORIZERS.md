# Script SQL - Tabela merchant_authorizers

## Descrição
Este script cria a tabela `merchant_authorizers` no banco de dados PostgreSQL para armazenar os autorizadores de pagamento configurados para cada estabelecimento.

## Estrutura da Tabela

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | ID único do autorizador (auto-incremento) |
| `slug` | varchar(50) | Slug único para identificação |
| `active` | boolean | Status ativo/inativo (default: true) |
| `dtinsert` | timestamp | Data de inserção (default: CURRENT_TIMESTAMP) |
| `dtupdate` | timestamp | Data de atualização (default: CURRENT_TIMESTAMP) |
| `type` | varchar(100) | Tipo do autorizador (obrigatório) |
| `conciliar_transacoes` | varchar(10) | Se concilia transações: 'sim' ou 'nao' (default: 'nao') |
| `merchant_id` | varchar(100) | ID do merchant no autorizador |
| `token_cnp` | varchar(255) | Token CNP no autorizador |
| `terminal_id` | varchar(100) | ID do terminal |
| `id_conta` | varchar(100) | ID da conta (apenas para DOCK PIX) |
| `chave_pix` | varchar(255) | Chave PIX (apenas para DOCK PIX) |
| `id_merchant` | bigint | ID do estabelecimento (FK para merchants) |

### Tipos de Autorizadores Suportados

1. **GLOBAL PAYMENTS**
   - Campos utilizados: `merchant_id`, `token_cnp`, `terminal_id`
   - Não utiliza: `id_conta`, `chave_pix`

2. **AUTORIZADOR DOCK PIX**
   - Campos utilizados: `id_conta`, `chave_pix`, `terminal_id`
   - Não utiliza: `merchant_id`, `token_cnp`

3. **DOCK | POSTILION**
   - Campos utilizados: `merchant_id`, `token_cnp`, `terminal_id`
   - Não utiliza: `id_conta`, `chave_pix`

4. **GLOBAL PAYMENTS ECOMMERCE**
   - Campos utilizados: `merchant_id`, `token_cnp`, `terminal_id`
   - Não utiliza: `id_conta`, `chave_pix`

## Índices Criados

1. `idx_merchant_authorizers_id_merchant` - Para buscas por merchant
2. `idx_merchant_authorizers_type` - Para buscas por tipo de autorizador
3. `idx_merchant_authorizers_active` - Para buscas por status ativo

## Foreign Keys

- `merchant_authorizers_id_merchant_fkey`: Referência `merchants(id)` com `ON DELETE CASCADE`

## Como Executar

### Opção 1: Via psql
```bash
psql -U seu_usuario -d seu_banco -f database/migrations/create_merchant_authorizers_table.sql
```

### Opção 2: Via pgAdmin
1. Abra o pgAdmin
2. Conecte-se ao banco de dados
3. Clique com botão direito em "Query Tool"
4. Abra o arquivo `create_merchant_authorizers_table.sql`
5. Execute o script (F5)

### Opção 3: Via Drizzle (se configurado)
```bash
npm run db:push
# ou
npx drizzle-kit push
```

## Verificação

Após executar o script, verifique se a tabela foi criada:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'merchant_authorizers';

-- Verificar estrutura da tabela
\d merchant_authorizers

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'merchant_authorizers';

-- Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'merchant_authorizers';
```

## Exemplo de Uso

### Inserir um autorizador
```sql
INSERT INTO merchant_authorizers (
    slug,
    active,
    type,
    conciliar_transacoes,
    merchant_id,
    token_cnp,
    terminal_id,
    id_merchant
) VALUES (
    'auth-global-001',
    true,
    'GLOBAL PAYMENTS',
    'sim',
    'MERCHANT123',
    'TOKEN456',
    'TERMINAL789',
    1
);
```

### Buscar autorizadores de um merchant
```sql
SELECT * 
FROM merchant_authorizers 
WHERE id_merchant = 1 
AND active = true;
```

### Soft delete (desativar) um autorizador
```sql
UPDATE merchant_authorizers 
SET active = false, 
    dtupdate = CURRENT_TIMESTAMP 
WHERE id = 1;
```

## Notas Importantes

1. **Soft Delete**: A tabela utiliza soft delete através do campo `active`. Registros não são fisicamente removidos.

2. **Cascade Delete**: Se um merchant for deletado, todos os seus autorizadores serão automaticamente deletados (CASCADE).

3. **Campos Opcionais**: Dependendo do tipo de autorizador, alguns campos podem ser NULL.

4. **Validação**: A validação dos campos é feita no código da aplicação (Zod schema).

## Rollback (se necessário)

```sql
-- Remover foreign key
ALTER TABLE merchant_authorizers 
DROP CONSTRAINT IF EXISTS merchant_authorizers_id_merchant_fkey;

-- Remover índices
DROP INDEX IF EXISTS idx_merchant_authorizers_id_merchant;
DROP INDEX IF EXISTS idx_merchant_authorizers_type;
DROP INDEX IF EXISTS idx_merchant_authorizers_active;

-- Remover tabela
DROP TABLE IF EXISTS merchant_authorizers;

-- Remover sequence
DROP SEQUENCE IF EXISTS merchant_authorizers_id_seq;
```


