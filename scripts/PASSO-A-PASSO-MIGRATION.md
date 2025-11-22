# Passo a Passo: Executar Migration no Neon/Vercel Postgres

## Pré-requisitos
- Acesso ao console do Neon (neon.tech) ou Vercel Postgres
- Credenciais do banco de dados

## Migration a ser executada
**Arquivo:** `drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql`

## Opção 1: Executar via Neon Console (Recomendado)

### Passo 1: Acessar o Neon Console
1. Acesse [https://console.neon.tech](https://console.neon.tech)
2. Faça login na sua conta
3. Selecione o projeto que contém o banco de dados do portal-outbank

### Passo 2: Abrir o SQL Editor
1. No menu lateral, clique em **"SQL Editor"** ou **"Query"**
2. Você verá um editor SQL

### Passo 3: Copiar e Executar a Migration
1. Abra o arquivo `drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no editor SQL do Neon
4. Clique em **"Run"** ou **"Execute"** (ou pressione `Ctrl+Enter`)

### Passo 4: Verificar se funcionou
Execute esta query para verificar se a coluna foi adicionada:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'restrict_customer_data';
```

Você deve ver uma linha com:
- `column_name`: `restrict_customer_data`
- `data_type`: `boolean`
- `column_default`: `false`

---

## Opção 2: Executar via Vercel Postgres (se estiver usando Vercel)

### Passo 1: Acessar Vercel Dashboard
1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login
3. Selecione o projeto **portal-outbank**

### Passo 2: Acessar o Postgres
1. No menu do projeto, clique em **"Storage"** ou **"Databases"**
2. Encontre o banco de dados Postgres associado
3. Clique no banco para abrir os detalhes

### Passo 3: Abrir o SQL Editor
1. Procure por **"SQL Editor"** ou **"Query"**
2. Clique para abrir o editor SQL

### Passo 4: Copiar e Executar a Migration
1. Abra o arquivo `drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no editor SQL do Vercel
4. Clique em **"Run"** ou **"Execute"**

### Passo 5: Verificar se funcionou
Execute esta query para verificar:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'restrict_customer_data';
```

---

## Opção 3: Executar via psql (Linha de Comando)

### Passo 1: Obter Connection String
1. No Neon ou Vercel, vá para as configurações do banco
2. Copie a **Connection String** (formato: `postgresql://user:password@host/database`)

### Passo 2: Executar via psql
```bash
# No terminal, execute:
psql "sua-connection-string-aqui" -f drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql
```

**OU** se preferir copiar e colar diretamente:
```bash
# Conecte ao banco:
psql "sua-connection-string-aqui"

# Depois, dentro do psql, cole o conteúdo do arquivo SQL e pressione Enter
```

### Passo 3: Verificar
Dentro do psql, execute:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'restrict_customer_data';
```

---

## Opção 4: Usando Drizzle Kit (Recomendado para desenvolvimento)

Se você tem o Drizzle Kit configurado localmente:

### Passo 1: Verificar configuração
Certifique-se de que o arquivo `drizzle.config.ts` está configurado corretamente com as credenciais do banco.

### Passo 2: Executar migration
```bash
# Executar todas as migrations pendentes
npx drizzle-kit push

# OU executar migrations manualmente via drizzle-kit
npx drizzle-kit migrate
```

---

## Conteúdo da Migration

A migration adiciona uma coluna `restrict_customer_data` (boolean, default false) na tabela `profiles`.

```sql
ALTER TABLE "profiles" 
ADD COLUMN "restrict_customer_data" boolean DEFAULT false;

-- Super Admin nunca tem restrição (atualizar se existir)
UPDATE "profiles" 
SET "restrict_customer_data" = false 
WHERE UPPER("name") LIKE '%SUPER%';

-- Comentário na coluna
COMMENT ON COLUMN "profiles"."restrict_customer_data" IS 'Quando true, usuários desta categoria terão CPF, CNPJ, email e telefone mascarados. Nome fantasia, razão social, cidade e estado sempre visíveis.';
```

---

## Troubleshooting

### Erro: "column already exists"
Se você receber este erro, significa que a coluna já existe. Você pode verificar:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'restrict_customer_data';
```

Se retornar um resultado, a migration já foi executada.

### Erro: "permission denied"
Certifique-se de estar usando uma conexão com permissões de administrador (owner) do banco de dados.

### Erro: "table does not exist"
Verifique se a tabela `profiles` existe:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profiles';
```

---

## Após executar a migration

1. ✅ Verifique se a coluna foi criada (query de verificação acima)
2. ✅ Teste o sistema de categorias no ambiente de produção
3. ✅ Crie uma categoria de teste e verifique se o campo `restrictCustomerData` funciona

---

## Nota Importante

- ⚠️ **Backup**: Recomenda-se fazer backup do banco antes de executar migrations em produção
- ⚠️ **Teste**: Execute primeiro em ambiente de desenvolvimento/staging se possível
- ⚠️ **Horário**: Execute migrations em horários de menor uso do sistema





