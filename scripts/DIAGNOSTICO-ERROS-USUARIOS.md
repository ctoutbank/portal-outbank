# Diagnóstico: Erros no Filtro, Criação e Edição de Usuários

## Status Atual
- ✅ Tabela `admin_customers` existe no banco de produção
- ❌ Filtro de usuários ainda apresenta erros
- ❌ Criação de novo usuário ainda apresenta erros
- ❌ Edição de usuário ainda apresenta erros

## Problemas Identificados no Código

### 1. **Problema no InsertUser - Sempre cria com perfil ADMIN**
**Arquivo:** `src/features/customers/users/_actions/user-actions.ts` (linha ~222)
**Problema:** A função `InsertUser` **sempre busca o perfil ADMIN** e cria o usuário com esse perfil, independente do `idProfile` passado. Depois, tentamos atualizar o perfil via `updateUserPermissions`, mas isso pode falhar.

**Código problemático:**
```typescript
// InsertUser sempre busca perfil ADMIN
const adminProfile = await db
  .select({ id: profiles.id })
  .from(profiles)
  .where(and(ilike(profiles.name, "%ADMIN%"), eq(profiles.active, true)))
  .limit(1);

// Cria com perfil ADMIN sempre
const created = await db.insert(users).values({
  // ...
  idProfile, // ← Sempre será ADMIN
  fullAccess: false, // ← Sempre false
  // ...
});
```

**Solução necessária:** 
- Modificar `InsertUser` para aceitar `idProfile` e `fullAccess` opcionais
- OU garantir que `updateUserPermissions` sempre funcione após a criação

### 2. **InsertUser retorna Array mas esperamos Number**
**Arquivo:** `src/features/users/_components/admin-user-permissions-form.tsx` (linha ~172)
**Problema:** `InsertUser` retorna `newUser[0].id` (do `.returning()`), mas pode estar retornando um array. Precisamos verificar se está retornando o ID corretamente.

**Código:**
```typescript
const userId = await InsertUser({...});
// userId pode ser um array [ { id: 123 } ] ou apenas 123
```

**Solução:** Verificar o retorno e extrair o ID corretamente.

### 3. **Filtro - Falta export const dynamic**
**Arquivo:** `src/app/config/users/page.tsx`
**Problema:** A página tem `export const revalidate = 0`, mas **falta** `export const dynamic = 'force-dynamic'`, necessário no Next.js 15 para páginas que usam search params.

**Solução:** Adicionar:
```typescript
export const revalidate = 0;
export const dynamic = 'force-dynamic';
```

### 4. **Filtro - router.push pode não estar funcionando**
**Arquivo:** `src/features/users/_components/admin-users-filter.tsx` (linha ~80)
**Problema:** `router.push()` com `router.refresh()` pode não estar atualizando a página corretamente se a página não for dinâmica.

**Solução:** Usar `router.replace()` em vez de `router.push()` ou garantir que a página seja dinâmica.

### 5. **Edição - Problema ao carregar adminCustomers**
**Arquivo:** `src/app/config/users/[id]/page.tsx` (linha ~57)
**Problema:** Mesmo com `.catch()`, se `getAdminCustomers` lançar um erro não tratado, a página pode quebrar.

**Código atual:**
```typescript
getAdminCustomers(userId).catch((error) => {
  console.warn('Erro ao buscar ISOs autorizados (tabela pode não existir):', error);
  return [];
}),
```

**Solução:** O tratamento está correto, mas precisamos garantir que o erro seja realmente capturado.

### 6. **Página de Edição - Falta export const dynamic**
**Arquivo:** `src/app/config/users/[id]/page.tsx`
**Problema:** Página dinâmica com `params` precisa ter `export const dynamic = 'force-dynamic'`.

**Solução:** Adicionar no topo do arquivo:
```typescript
export const revalidate = 0;
export const dynamic = 'force-dynamic';
```

## Possíveis Causas

### 1. **Tabela `admin_customers` existe mas estrutura está incorreta**
- A tabela pode ter sido criada parcialmente
- Constraints podem estar faltando
- Colunas podem ter nomes diferentes do esperado

**Verificação:**
```sql
-- Execute no Neon Console
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- `id` (BIGINT)
- `slug` (VARCHAR)
- `dtinsert` (TIMESTAMP)
- `dtupdate` (TIMESTAMP)
- `active` (BOOLEAN)
- `id_user` (BIGINT)
- `id_customer` (BIGINT)

### 2. **Erro na query quando a tabela existe mas está vazia**
- A função `getAdminCustomers()` pode estar falhando mesmo com a tabela existente
- Join com `customers` pode estar falhando

**Verificação:**
```sql
-- Testar query manualmente
SELECT 
    ac.id,
    ac.id_customer,
    c.name AS customer_name,
    c.slug AS customer_slug,
    ac.active
FROM admin_customers ac
LEFT JOIN customers c ON ac.id_customer = c.id
WHERE ac.id_user = 1 AND ac.active = true;
```

### 3. **Problema com Foreign Keys**
- Se `id_user` ou `id_customer` não existirem nas tabelas referenciadas
- Constraints podem estar bloqueando queries

**Verificação:**
```sql
-- Verificar constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'admin_customers'::regclass;
```

### 4. **Erro no Filtro - Problema com URL Search Params**
- Next.js pode não estar processando corretamente os search params
- Router pode não estar atualizando a página

**Sintomas:**
- Filtro abre mas não aplica os filtros
- URL não muda ao aplicar filtros
- Página não recarrega após filtrar

### 5. **Erro na Criação - Problema com InsertUser ou createAdminUser**
- Função `InsertUser` pode não aceitar todos os parâmetros
- `createAdminUser` pode estar falhando ao inserir em `admin_customers`

**Sintomas:**
- Formulário não submete
- Erro ao criar usuário no Clerk
- Erro ao inserir no banco de dados

### 6. **Erro na Edição - Problema ao carregar dados**
- `getUserDetailWithClerk` pode estar falhando
- `getAdminCustomers` pode estar falhando mesmo com tratamento de erro
- Problema ao mapear dados para o formulário

**Sintomas:**
- Página não carrega ao editar usuário
- Erro ao carregar ISOs autorizados
- Formulário não popula com dados do usuário

## Verificações Necessárias

### 1. Verificar Logs do Vercel
Acesse o Vercel Dashboard > Logs e procure por:
- `Error [NeonDbError]`
- `relation "admin_customers" does not exist`
- `Error ao buscar ISOs autorizados`
- `Erro ao criar usuário`
- `Erro ao atualizar usuário`

### 2. Verificar Console do Navegador
Abra o DevTools (F12) e procure por:
- Erros no console (vermelho)
- Warnings (amarelo)
- Mensagens de erro do componente

### 3. Verificar Estrutura da Tabela
Execute no Neon Console:
```sql
-- Ver estrutura completa
\d admin_customers

-- Ou
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;
```

### 4. Testar Query Manualmente
```sql
-- Testar se consegue buscar da tabela
SELECT * FROM admin_customers LIMIT 5;

-- Testar join com customers
SELECT 
    ac.*,
    c.name AS customer_name
FROM admin_customers ac
LEFT JOIN customers c ON ac.id_customer = c.id
LIMIT 5;
```

## Informações Necessárias para Diagnóstico

Para identificar o problema exato, preciso das seguintes informações:

1. **Logs do Vercel:**
   - Copie o erro completo do Vercel (include stack trace)
   - Veja em: Vercel Dashboard > Deployments > Latest > Logs

2. **Console do Navegador:**
   - Erros no console ao tentar usar filtro
   - Erros ao criar usuário
   - Erros ao editar usuário

3. **Estrutura da Tabela:**
   - Resultado do `\d admin_customers` ou query de estrutura

4. **Resultado das Queries de Teste:**
   - Se `SELECT * FROM admin_customers` funciona
   - Se o JOIN com `customers` funciona

5. **Comportamento Específico:**
   - O que acontece exatamente ao usar o filtro? (nada acontece, erro, etc.)
   - O que acontece ao criar usuário? (erro, sucesso mas sem salvar, etc.)
   - O que acontece ao editar usuário? (página não carrega, erro, etc.)

## Possíveis Soluções Rápidas

### Se a tabela existe mas queries falham:
```sql
-- Verificar permissões
GRANT ALL ON admin_customers TO current_user;

-- Verificar se schema está correto
SELECT table_schema 
FROM information_schema.tables 
WHERE table_name = 'admin_customers';
```

### Se foreign keys estão bloqueando:
```sql
-- Verificar se existem usuários e customers
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM customers;
```

### Se o problema é com o código:
- Verificar se `router.refresh()` está sendo chamado corretamente
- Verificar se `useRouter()` está importado corretamente
- Verificar se `toast` está funcionando para mostrar erros

## Próximos Passos

1. Execute as queries de verificação acima
2. Copie os logs de erro do Vercel
3. Copie os erros do console do navegador
4. Compartilhe essas informações para diagnóstico preciso

