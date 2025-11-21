# 📋 Guia de Execução das Migrations - Fase 2

## ✅ O que foi criado automaticamente

Todas as migrations e código foram criados automaticamente:

1. ✅ **5 migrations SQL** criadas em `drizzle/migrations/`:
   - `0005_add_customer_modules_table.sql`
   - `0006_add_merchant_modules_table.sql`
   - `0007_add_module_consents_table.sql`
   - `0008_add_stakeholders_table.sql`
   - `0009_add_stakeholder_customers_table.sql`

2. ✅ **Schema Drizzle atualizado** (`drizzle/schema.ts` e `drizzle/relations.ts`)

3. ✅ **Server actions criadas** (`src/lib/modules/`)

4. ✅ **Script automático criado** (`scripts/run-modules-migrations.mjs`)

---

## 🚀 Como executar as migrations (AUTOMÁTICO)

### Opção 1: Usando npm (RECOMENDADO)

Abra o PowerShell na pasta do projeto e execute:

```powershell
npm run migrate:modules
```

### Opção 2: Executar diretamente

```powershell
node scripts/run-modules-migrations.mjs
```

---

## ⚙️ Pré-requisitos

Antes de executar, certifique-se de que:

1. ✅ O arquivo `.env.local` existe na raiz do projeto
2. ✅ O arquivo `.env.local` contém uma das variáveis:
   - `DATABASE_URL=...`
   - `POSTGRES_URL=...`
   - `NEON_DATABASE_URL=...`

---

## 📝 O que o script faz

O script `run-modules-migrations.mjs`:

1. ✅ Conecta ao banco de dados usando as variáveis de ambiente
2. ✅ Verifica se cada tabela já existe antes de criar
3. ✅ Executa as migrations em ordem (0005 → 0009)
4. ✅ Pula migrations que já foram executadas (tabelas já existem)
5. ✅ Mostra um resumo completo da execução

---

## 🔍 Verificação manual (opcional)

Se quiser verificar manualmente se as tabelas foram criadas, você pode executar no banco:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'customer_modules',
    'merchant_modules',
    'module_consents',
    'stakeholders',
    'stakeholder_customers'
  )
ORDER BY table_name;
```

---

## ❌ Se algo der errado

### Erro: "DATABASE_URL não encontrada"

**Solução:** Verifique se o arquivo `.env.local` existe e contém uma das variáveis:
- `DATABASE_URL=...`
- `POSTGRES_URL=...`
- `NEON_DATABASE_URL=...`

### Erro: "Connection refused" ou "Cannot connect"

**Solução:** Verifique se:
1. A string de conexão está correta
2. O banco de dados está acessível
3. As credenciais estão corretas

### Erro: "Table already exists"

**Solução:** Isso é normal! O script detecta automaticamente e pula a migration. Não é um erro.

---

## 📊 Tabelas que serão criadas

1. **customer_modules** - Relaciona ISOs com módulos
2. **merchant_modules** - Relaciona ECs/Correntistas com módulos (com consentimento LGPD)
3. **module_consents** - Histórico de consentimentos LGPD
4. **stakeholders** - Parceiros intermediários
5. **stakeholder_customers** - Relaciona stakeholders com ISOs

---

## ✅ Próximos passos após executar

Depois que as migrations forem executadas com sucesso:

1. ✅ As tabelas estarão prontas para uso
2. ✅ Você pode prosseguir para a Fase 3 (Sistema de Consentimento LGPD)
3. ✅ As funções em `src/lib/modules/` já estarão funcionando

---

## 🆘 Precisa de ajuda?

Se encontrar algum problema, verifique:
1. ✅ Logs do script (ele mostra detalhes de cada migration)
2. ✅ Variáveis de ambiente no `.env.local`
3. ✅ Conexão com o banco de dados

