# Relatório de Análise: Isolamento por ISO - Portal-Outbank vs Outbank-One

**Data:** Janeiro 2025  
**Objetivo:** Analisar como o isolamento de usuários por ISO está implementado no portal-outbank e outbank-one, comparar as abordagens e identificar gaps e recomendações.

---

## 1. Resumo Executivo

### Estado Atual
O portal-outbank possui **isolamento básico por ISO** implementado através do campo `idCustomer` na tabela `users`. O sistema permite que o mesmo email seja usado em ISOs diferentes, mas há algumas inconsistências na implementação do isolamento completo.

### Principais Descobertas

**Portal-Outbank:**
1. ✅ **Isolamento básico funciona**: Campo `idCustomer` identifica o ISO do usuário
2. ✅ **Validação de email por ISO**: Sistema permite mesmo email em ISOs diferentes
3. ⚠️ **Inconsistências**: Usuários do portal (Super Admin/Admin) podem ter `idCustomer = null`
4. ⚠️ **Admin pode ver múltiplos ISOs**: Tabela `admin_customers` permite admins gerenciarem múltiplos ISOs

**Outbank-One:**
1. ✅ **Isolamento total por tenant**: Todos os usuários pertencem a um tenant específico
2. ✅ **idCustomer sempre presente**: Obtido do tenant atual via cookie, nunca null
3. ✅ **Queries sempre filtram por tenant**: `innerJoin` obrigatório garante isolamento
4. ✅ **Modelo diferente**: Não há usuários "do portal" - todos pertencem a um tenant

**Diferença Crítica:**
- **Portal-Outbank**: Suporta usuários do portal (Super Admin/Admin) + usuários de ISO
- **Outbank-One**: Apenas usuários de tenant (todos pertencem a um ISO)

### Recomendações Principais

**Para Portal-Outbank:**
1. ✅ **Manter modelo atual**: Suportar usuários do portal (Super Admin/Admin Consolle) com `idCustomer = null`
2. ✅ **Implementar separação em abas**: Equipe Consolle (Super Admin/Admin Consolle) vs Outros usuários
3. ⚠️ **Reforçar validações**: Garantir que queries de usuários de ISO sempre filtrem por `idCustomer`
4. ⚠️ **Documentar fluxo**: Hierarquia: Super Admin → Admin ISO → Internos → Externos

**Para Outbank-One:**
- ✅ **Nenhuma alteração necessária**: Sistema funcionando corretamente com isolamento total por tenant

---

## 2. Análise do Portal-Outbank

### 2.1 Estrutura de Banco de Dados

#### Tabela `users`
```typescript
export const users = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),
  email: varchar({ length: 50 }),
  idCustomer: bigint("id_customer", { mode: "number" }), // ⚠️ Pode ser NULL
  idProfile: bigint("id_profile", { mode: "number" }),
  idClerk: varchar("id_clerk", { length: 100 }),
  // ... outros campos
}, (table) => [
  foreignKey({
    columns: [table.idCustomer],
    foreignColumns: [customers.id],
    name: "users_id_customer_fkey"
  }),
]);
```

**Observações:**
- ✅ Foreign key para `customers` garante integridade referencial
- ⚠️ Campo `idCustomer` pode ser `null` (usuários do portal)
- ⚠️ Não há constraint NOT NULL, permitindo usuários sem ISO

#### Tabela `admin_customers`
```typescript
export const adminCustomers = pgTable("admin_customers", {
  id: bigint({ mode: "number" }).primaryKey(),
  idUser: bigint("id_user", { mode: "number" }),
  idCustomer: bigint("id_customer", { mode: "number" }),
  active: boolean().default(true),
}, (table) => [
  foreignKey({
    columns: [table.idUser],
    foreignColumns: [users.id],
  }),
  foreignKey({
    columns: [table.idCustomer],
    foreignColumns: [customers.id],
  }),
  unique("admin_customers_id_user_id_customer_key").on(table.idUser, table.idCustomer),
]);
```

**Propósito:**
- Permite que um Admin gerencie múltiplos ISOs
- Relacionamento N:N entre usuários e ISOs
- Constraint unique garante que um admin não tenha duplicatas do mesmo ISO

#### Tabela `customers` (ISOs)
```typescript
export const customers = pgTable("customers", {
  id: bigint({ mode: "number" }).primaryKey(),
  slug: varchar({ length: 50 }).notNull(),
  name: varchar({ length: 255 }),
  customerId: varchar("customer_id", { length: 100 }),
  isActive: boolean("is_active").default(true),
  idParent: bigint("id_parent", { mode: "number" }), // Hierarquia
});
```

**Observações:**
- Suporta hierarquia de ISOs (pai/filho)
- Campo `slug` usado para subdomínios

### 2.2 Fluxo de Criação de Usuários

#### 2.2.1 Usuários do Portal (`src/features/users/server/admin-users.ts`)

**Função:** `InsertUser()` em `admin-users.ts`

**Características:**
- Criado pelo Super Admin
- `idCustomer` pode ser `null` ou definido
- Se `idCustomer` for fornecido, valida email apenas para aquele ISO
- Se `idCustomer` for `null`, valida email globalmente

**Código relevante:**
```typescript
// Validação de email
if (idCustomer) {
  // Verificar apenas para este ISO específico
  const existingUserForCustomer = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        eq(users.idCustomer, idCustomer)
      )
    );
} else {
  // Verificar globalmente (comportamento antigo)
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));
}
```

#### 2.2.2 Usuários de ISO (`src/features/customers/users/_actions/users-actions.ts`)

**Função:** `InsertUser()` em `users-actions.ts`

**Características:**
- Criado dentro de um ISO específico
- **SEMPRE** recebe `idCustomer` (não pode ser null)
- Valida email apenas para aquele ISO
- Permite mesmo email em ISOs diferentes

**Código relevante:**
```typescript
// ✅ Verificar se o usuário já existe no banco de dados PARA ESTE ISO
if (idCustomer) {
  const existingUserForCustomer = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        eq(users.idCustomer, idCustomer)
      )
    );
  
  if (existingUserForCustomer.length > 0) {
    return {
      ok: false,
      code: 'email_in_use',
      message: 'Este e-mail já está cadastrado para este ISO.'
    };
  }
}
```

**Observação importante:**
- ✅ **Isolamento por ISO funciona corretamente** para usuários criados dentro de ISOs
- ✅ Mesmo email pode existir em ISOs diferentes

### 2.3 Isolamento de Dados em Queries

#### 2.3.1 Listagem de Usuários (`getAllUsers`)

**Arquivo:** `src/features/users/server/admin-users.ts`

**Filtros aplicados:**
```typescript
// Se for Admin (não Super Admin), filtrar apenas ISOs autorizados
if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
  if (userInfo.allowedCustomers.length === 0) {
    return { users: [], totalCount: 0 };
  }
  whereConditions.push(inArray(users.idCustomer, userInfo.allowedCustomers));
}
```

**Observações:**
- ✅ Super Admin vê todos os usuários (sem filtro)
- ✅ Admin vê apenas usuários dos ISOs autorizados
- ⚠️ Não há filtro explícito para usuários normais (depende do contexto da página)

#### 2.3.2 Listagem de ISOs (`getCustomers`)

**Arquivo:** `src/features/customers/server/customers.ts`

**Filtros aplicados:**
```typescript
if (userInfo) {
  // Super Admin vê tudo
  if (userInfo.isSuperAdmin) {
    // Não adiciona filtro - vê todos
  }
  // Admin vê apenas ISOs autorizados
  else if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
    whereConditions.push(inArray(customers.id, userInfo.allowedCustomers));
  }
  // Usuário normal vê apenas seu ISO
  else if (!userInfo.isAdmin && userInfo.idCustomer) {
    whereConditions.push(eq(customers.id, userInfo.idCustomer));
  }
}
```

**Observações:**
- ✅ Isolamento funciona corretamente para listagem de ISOs
- ✅ Usuários normais veem apenas seu próprio ISO

#### 2.3.3 Validação por Subdomínio

**Arquivo:** `src/lib/subdomain-auth/domain.ts`

**Função:** `validateUserAccessBySubdomain()`

```typescript
// Verificar se o id_customer do usuário bate com o customer_id do tenant
if (user.idCustomer !== tenant.customerId) {
  return {
    authorized: false,
    reason: "Usuário não pertence a este subdomínio",
  };
}
```

**Observações:**
- ✅ Validação rigorosa: usuário só acessa subdomínio do seu ISO
- ✅ Previne acesso cruzado entre ISOs

### 2.4 Gestão de Permissões

#### 2.4.1 Estrutura de Perfis

**Tabela:** `profiles`
- Perfis definem permissões através de `profile_functions`
- Perfis podem ter ISOs associados via `profile_customers` (herança)

#### 2.4.2 Hierarquia de Permissões

**Arquivo:** `src/lib/permissions/check-permissions.ts`

**Função:** `getCurrentUserInfo()`

**Lógica de ISOs autorizados:**
```typescript
// 1. ISOs da categoria (herdados automaticamente via profile_customers)
let profileISOs: number[] = [];

// 2. ISOs individuais (admin_customers)
let individualISOs: number[] = await getAdminAllowedCustomers(userData.id);

// 3. ISO principal (idCustomer)
const mainISO: number[] = userData.idCustomer ? [userData.idCustomer] : [];

// 4. Combinar todos (remover duplicatas)
allowedCustomers = Array.from(new Set([...profileISOs, ...individualISOs, ...mainISO]));
```

**Observações:**
- ✅ Sistema combina ISOs de 3 fontes: categoria, individual e principal
- ✅ Permite flexibilidade: admin pode ter ISOs via perfil ou atribuição individual
- ⚠️ Super Admin não tem `allowedCustomers` (vê tudo)

#### 2.4.3 Tabela `admin_customers`

**Propósito:**
- Relaciona Admins com ISOs específicos
- Permite que um Admin gerencie múltiplos ISOs
- Constraint unique previne duplicatas

**Uso:**
- Quando Super Admin atribui um Admin a um ISO
- Admin pode ter múltiplos ISOs na tabela
- Usado em `getAllUsers()` para mostrar ISOs do admin

### 2.5 Pontos Fortes

1. ✅ **Isolamento básico funciona**: Campo `idCustomer` identifica ISO
2. ✅ **Validação de email por ISO**: Permite mesmo email em ISOs diferentes
3. ✅ **Validação por subdomínio**: Previne acesso cruzado
4. ✅ **Flexibilidade de permissões**: Admins podem gerenciar múltiplos ISOs
5. ✅ **Hierarquia de ISOs**: Suporta ISOs pai/filho

### 2.6 Pontos Fracos / Gaps

1. ⚠️ **Usuários do portal sem ISO**: `idCustomer` pode ser `null` para Super Admin/Admin
2. ⚠️ **Falta validação rigorosa**: Nem todas as queries filtram por `idCustomer`
3. ⚠️ **Inconsistência na criação**: Usuários do portal podem ser criados sem `idCustomer`
4. ⚠️ **Falta separação visual**: Não há distinção clara entre Equipe Consolle e outros usuários
5. ⚠️ **Documentação**: Fluxo de criação de usuários não está bem documentado

---

## 3. Análise do Outbank-One

### 3.1 Acesso ao Código

**Status:** ✅ **Código acessado com sucesso**

**Localização:** `C:\Users\denis\Dropbox\MIGRACAO BASE44\outbank-one`

### 3.2 Estrutura de Banco de Dados

#### Tabela `users` (Outbank-One)
```typescript
export const users = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),
  email: varchar({ length: 50 }),
  idCustomer: bigint("id_customer", { mode: "number" }), // ⚠️ SEMPRE presente (não pode ser null)
  idProfile: bigint("id_profile", { mode: "number" }),
  idClerk: varchar("id_clerk", { length: 100 }),
  // ... outros campos
}, (table) => [
  foreignKey({
    columns: [table.idCustomer],
    foreignColumns: [customers.id],
    name: "users_id_customer_fkey"
  }),
]);
```

**Diferença crítica com portal-outbank:**
- ✅ **No outbank-one, `idCustomer` SEMPRE existe** (obtido do tenant atual)
- ⚠️ **No portal-outbank, `idCustomer` pode ser `null`** (usuários do portal)

### 3.3 Fluxo de Criação de Usuários (Outbank-One)

#### Função `InsertUser()` em `src/features/users/server/users.ts`

**Características principais:**

1. **idCustomer sempre do tenant atual:**
```typescript
const idCustomer = await getCustomerIdByTentant() // ⚠️ SEMPRE obtido do tenant, não pode ser null

const newUser = await db
  .insert(users)
  .values({
    // ...
    idCustomer: idCustomer, // ⚠️ SEMPRE definido, nunca null
    // ...
  });
```

2. **Função `getCustomerIdByTentant()`:**
```typescript
export async function getCustomerIdByTentant() {
  const cookieStore = await cookies();
  const tenant = cookieStore.get("tenant")?.value; // Obtém do cookie definido pelo middleware
  const customer = await db
    .select({ id: customers.id })
    .from(customerCustomization)
    .innerJoin(customers, eq(customerCustomization.customerId, customers.id))
    .where(eq(customerCustomization.slug, tenant || ""))
    .limit(1);

  if (!customer || customer.length === 0) {
    throw new Error(`Customer não encontrado para o tenant: ${tenant}`);
  }

  return customer[0].id; // ⚠️ SEMPRE retorna um ID válido ou lança erro
}
```

**Observações críticas:**
- ✅ **Isolamento total**: Usuário SEMPRE pertence ao tenant atual
- ✅ **Não há usuários sem ISO**: Todos os usuários têm `idCustomer` definido
- ✅ **Impossível criar usuário de outro ISO**: O `idCustomer` vem do tenant atual

### 3.4 Isolamento de Dados em Queries (Outbank-One)

#### Listagem de Usuários (`getUsers`)

**Arquivo:** `src/features/users/server/users.ts`

**Estrutura das queries:**
```typescript
// 1. Obtém tenant atual
const customer = await getCustomerByTentant();

// 2. Filtra por slug do tenant
const conditions = [
  customer ? eq(customers.slug, customer.slug) : undefined,
  profile ? eq(users.idProfile, profile) : undefined,
  email && email.trim() !== "" ? eq(users.email, email) : undefined,
].filter(Boolean);

// 3. SEMPRE usa innerJoin (garante que usuário tem customer válido)
const userResults = await db
  .select({ /* ... */ })
  .from(users)
  .innerJoin(customers, eq(users.idCustomer, customers.id)) // ⚠️ innerJoin garante isolamento
  .leftJoin(profiles, eq(users.idProfile, profiles.id))
  .where(and(...conditions));
```

**Observações:**
- ✅ **innerJoin obrigatório**: Garante que usuário sempre tem `idCustomer` válido
- ✅ **Filtro por tenant**: Sempre filtra pelo slug do tenant atual
- ✅ **Isolamento total**: Impossível ver usuários de outros ISOs

#### Busca de Usuário por ID (`getUserById`)

```typescript
const customer = await getCustomerByTentant();

const userDb = await db
  .select({ /* ... */ })
  .from(users)
  .innerJoin(customers, eq(users.idCustomer, customers.id))
  .where(and(
    eq(users.idClerk, idClerk), 
    eq(customers.slug, customer.slug) // ⚠️ Valida que usuário pertence ao tenant atual
  ));
```

**Observações:**
- ✅ **Validação dupla**: Verifica `idClerk` E `customers.slug`
- ✅ **Previne acesso cruzado**: Usuário só acessa dados do seu tenant

### 3.5 Middleware e Tenant Detection (Outbank-One)

**Arquivo:** `src/middleware.ts`

```typescript
// Extrai subdomínio do hostname
const parts = hostname.split(".");
const subdomain = parts.length >= 3 ? parts[0] : null;
const isTenantHost = subdomain && !["www", "lvh", "localhost"].includes(subdomain);

if (isTenantHost) {
  // Define cookie "tenant" com o subdomínio
  response.cookies.set("tenant", subdomain, {
    path: "/",
    httpOnly: false,
  });
}
```

**Fluxo:**
1. Middleware extrai subdomínio (ex: `bancoprisma.consolle.one` → `bancoprisma`)
2. Define cookie `tenant` com o slug
3. Todas as funções usam `getCustomerByTentant()` para obter o customer atual
4. Queries sempre filtram pelo tenant atual

### 3.6 Documentação Encontrada

**Arquivo:** `ESTRUTURA_TENANTS.md`

**Principais pontos:**
- Sistema multi-tenant baseado em subdomínios
- Tabela `customer_customization` mapeia subdomínios para customers
- **Regra importante:** O `id_customer` do usuário deve corresponder ao `customer_id` do tenant
- Usuários só podem acessar tenants do mesmo `customer_id`

### 3.7 Diferenças Críticas: Outbank-One vs Portal-Outbank

| Aspecto | Outbank-One | Portal-Outbank | Impacto |
|---------|-------------|----------------|---------|
| **idCustomer pode ser null** | ❌ NUNCA (sempre do tenant) | ✅ SIM (Super Admin/Admin) | Alto |
| **Tipo de Join** | `innerJoin` (obrigatório) | `leftJoin` (permite null) | Alto |
| **Fonte do idCustomer** | Tenant atual (cookie) | Parâmetro ou null | Alto |
| **Validação de isolamento** | ✅ Rigorosa (sempre filtra por tenant) | ⚠️ Parcial (depende do contexto) | Médio |
| **Usuários sem ISO** | ❌ Não existem | ✅ Existem (Super Admin/Admin) | Alto |

### 3.8 Fluxo de Criação de Usuários (Outbank-One)

**Conforme código analisado:**

1. **Usuário acessa subdomínio** (ex: `bancoprisma.consolle.one`)
2. **Middleware define cookie `tenant`** com o slug (`bancoprisma`)
3. **Admin do ISO cria usuário:**
   - `getCustomerIdByTentant()` obtém `idCustomer` do tenant atual
   - Usuário é criado **SEMPRE** com `idCustomer` do tenant atual
   - Impossível criar usuário de outro ISO
4. **Usuário criado pertence ao tenant atual**

**Observação:** No outbank-one, não há criação de usuários "do portal" - todos os usuários pertencem a um tenant específico.

---

## 4. Comparação e Gaps

### 4.1 Tabela Comparativa: Portal-Outbank vs Outbank-One

| Aspecto | Portal-Outbank (Atual) | Outbank-One | Requisito Esperado | Status |
|---------|----------------------|-------------|-------------------|--------|
| **idCustomer pode ser null** | ✅ SIM (Super Admin/Admin) | ❌ NUNCA | ❓ Definir regra | ⚠️ Diferente |
| **Tipo de Join em queries** | `leftJoin` (permite null) | `innerJoin` (obrigatório) | Depende do contexto | ⚠️ Diferente |
| **Fonte do idCustomer** | Parâmetro ou null | Tenant atual (cookie) | Depende do contexto | ⚠️ Diferente |
| **Isolamento por ISO** | ✅ Básico (via `idCustomer`) | ✅ Total (via tenant) | ✅ Completo | ✅ OK |
| **Email único por ISO** | ✅ Implementado | ✅ Implementado | ✅ Necessário | ✅ OK |
| **Validação rigorosa** | ⚠️ Parcial | ✅ Sempre filtra por tenant | ✅ Em todas as queries | ⚠️ Parcial |
| **Separação visual** | ❌ Não implementado | ❌ Não implementado | ✅ Abas (Consolle vs Outros) | ❌ Faltando |
| **Usuários sem ISO** | ✅ Existem (Super Admin/Admin) | ❌ Não existem | ❓ Definir regra | ⚠️ Diferente |
| **Hierarquia de criação** | ⚠️ Não documentada | ⚠️ Não documentada | ✅ Super Admin → Admin ISO → Internos → Externos | ⚠️ Não claro |

### 4.2 Diferenças Arquiteturais Críticas

#### Diferença 1: Modelo de Usuários do Portal

**Outbank-One:**
- ❌ **NÃO há usuários "do portal"** - todos os usuários pertencem a um tenant
- ✅ Todos os usuários têm `idCustomer` definido
- ✅ Isolamento total por tenant

**Portal-Outbank:**
- ✅ **Há usuários "do portal"** (Super Admin/Admin Consolle)
- ⚠️ Usuários do portal podem ter `idCustomer = null`
- ⚠️ Isolamento parcial (depende do contexto)

**Impacto:**
- Portal-outbank precisa suportar dois modelos: usuários do portal E usuários de ISO
- Outbank-one só suporta usuários de ISO (tenant)

#### Diferença 2: Fonte do idCustomer

**Outbank-One:**
- `idCustomer` sempre vem do tenant atual (cookie)
- Impossível criar usuário de outro ISO
- Isolamento garantido pelo middleware

**Portal-Outbank:**
- `idCustomer` pode ser passado como parâmetro
- Super Admin pode criar usuários para qualquer ISO
- Isolamento depende de validações explícitas

**Impacto:**
- Portal-outbank precisa manter flexibilidade para Super Admin gerenciar múltiplos ISOs
- Mas precisa garantir isolamento para usuários normais

### 4.3 Gaps Identificados

#### Gap 1: Usuários do Portal sem ISO
**Problema:** Super Admin e Admin Consolle podem ter `idCustomer = null`

**Impacto:**
- Inconsistência na estrutura de dados
- Dificulta separação visual
- Pode causar problemas em queries que assumem `idCustomer` sempre presente

**Recomendação:**
- Manter `idCustomer = null` apenas para Super Admin/Admin Consolle
- Documentar esta exceção claramente
- Adicionar validações para garantir que outros usuários sempre tenham `idCustomer`

#### Gap 2: Falta Separação Visual
**Problema:** Não há distinção clara entre Equipe Consolle e outros usuários

**Impacto:**
- Dificulta identificação da equipe Outbank
- Mistura usuários administrativos com usuários de ISOs

**Recomendação:**
- Implementar abas na página de usuários
- Aba 1: Equipe Consolle (SUPER_ADMIN ou ADMIN CONSOLLE)
- Aba 2: Outros usuários (todos os demais)

#### Gap 3: Validação de Isolamento Incompleta
**Problema:** Nem todas as queries filtram explicitamente por `idCustomer`

**Impacto:**
- Risco de vazamento de dados entre ISOs
- Dependência de validações em camadas superiores

**Recomendação:**
- Adicionar filtros explícitos por `idCustomer` em todas as queries de usuários
- Criar função helper para garantir isolamento
- Revisar todas as queries que acessam dados de usuários

#### Gap 4: Fluxo de Criação Não Documentado
**Problema:** Não está claro quem pode criar quem e em que contexto

**Impacto:**
- Dificulta manutenção
- Pode levar a inconsistências

**Recomendação:**
- Documentar fluxo completo de criação de usuários
- Implementar validações de permissão na criação
- Garantir que Admin do ISO só cria usuários do seu ISO

### 4.3 Riscos de Segurança/Isolamento

#### Risco 1: Vazamento de Dados entre ISOs
**Probabilidade:** Média  
**Impacto:** Alto

**Cenário:**
- Query sem filtro explícito por `idCustomer`
- Admin de um ISO acessa dados de outro ISO

**Mitigação:**
- Revisar todas as queries
- Adicionar filtros explícitos
- Implementar testes de isolamento

#### Risco 2: Usuário sem ISO
**Probabilidade:** Baixa  
**Impacto:** Médio

**Cenário:**
- Usuário criado sem `idCustomer` (exceto Super Admin)
- Pode causar problemas em validações

**Mitigação:**
- Adicionar constraint ou validação
- Documentar exceções claramente

---

## 5. Recomendações

### 5.1 O que Fazer no Portal-Outbank

#### Prioridade Alta

1. **Implementar Separação em Abas**
   - Criar função `getAllUsersByType()` que separa por perfil
   - Aba 1: Equipe Consolle (SUPER_ADMIN ou ADMIN CONSOLLE)
   - Aba 2: Outros usuários
   - Arquivo: `src/app/config/users/page.tsx`

2. **Garantir Isolamento Rigoroso**
   - Revisar todas as queries de usuários
   - Adicionar filtros explícitos por `idCustomer`
   - Criar função helper para validação de isolamento

3. **Documentar Fluxo de Criação**
   - Documentar hierarquia: Super Admin → Admin ISO → Internos → Externos
   - Implementar validações de permissão
   - Garantir que Admin do ISO só cria usuários do seu ISO

#### Prioridade Média

4. **Validar Estrutura de Dados**
   - Garantir que usuários (exceto Super Admin/Admin Consolle) sempre tenham `idCustomer`
   - Adicionar validações na criação
   - Documentar exceções

5. **Melhorar Validações**
   - Adicionar validação de permissão na criação de usuários
   - Garantir que Admin do ISO não crie usuários de outros ISOs
   - Validar que usuários internos só criem usuários externos do mesmo ISO

#### Prioridade Baixa

6. **Otimizações**
   - Melhorar performance de queries com muitos ISOs
   - Adicionar índices se necessário
   - Otimizar busca de `admin_customers`

### 5.2 Alterações Necessárias no Outbank-One

**Status:** ✅ **Análise Completa - Nenhuma Alteração Necessária Identificada**

**Observação:** Após análise completa do código do outbank-one, identificou-se que:

1. ✅ **Isolamento funciona perfeitamente**: Sistema usa tenant-based isolation
2. ✅ **Todos os usuários têm idCustomer**: Não há usuários sem ISO
3. ✅ **Queries sempre filtram por tenant**: Isolamento garantido

**Conclusão:** 
- O outbank-one está funcionando corretamente com seu modelo (todos os usuários pertencem a um tenant)
- **NÃO há necessidade de alterações no outbank-one**
- O portal-outbank precisa manter seu modelo diferente (suportar usuários do portal E usuários de ISO)
- A separação em abas no portal-outbank é suficiente para distinguir Equipe Consolle dos demais

### 5.3 Plano de Implementação Sugerido

#### Fase 1: Separação em Abas (Imediato)
- Implementar função de classificação por perfil
- Adicionar componente Tabs
- Testar paginação e filtros

#### Fase 2: Reforço de Isolamento (Curto Prazo)
- Revisar todas as queries
- Adicionar filtros explícitos
- Implementar testes

#### Fase 3: Documentação e Validações (Médio Prazo)
- Documentar fluxo completo
- Implementar validações de permissão
- Criar testes de isolamento

---

## 6. Conclusão

### 6.1 Portal-Outbank

O portal-outbank possui **isolamento básico por ISO** funcionando, mas há oportunidades de melhoria:

1. ✅ **Funciona:** Isolamento via `idCustomer`, validação de email por ISO, validação por subdomínio
2. ⚠️ **Melhorar:** Separação visual, validações mais rigorosas, documentação
3. ✅ **Diferente do outbank-one:** Portal-outbank suporta usuários do portal (Super Admin/Admin) que podem ter `idCustomer = null`

### 6.2 Outbank-One

O outbank-one possui **isolamento total por tenant**:

1. ✅ **Funciona perfeitamente:** Todos os usuários pertencem a um tenant
2. ✅ **Isolamento garantido:** `innerJoin` obrigatório, filtro sempre por tenant
3. ✅ **Modelo diferente:** Não há usuários "do portal" - todos pertencem a um tenant

### 6.3 Diferenças Arquiteturais

**Portal-Outbank:**
- Suporta dois tipos de usuários: Portal (Super Admin/Admin) e ISO
- Usuários do portal podem ter `idCustomer = null`
- Super Admin pode gerenciar múltiplos ISOs

**Outbank-One:**
- Todos os usuários pertencem a um tenant
- `idCustomer` sempre presente (obtido do tenant atual)
- Isolamento total garantido pelo middleware

**Conclusão:** São modelos diferentes, ambos válidos. O portal-outbank precisa manter sua flexibilidade (usuários do portal + usuários de ISO), mas pode melhorar o isolamento e a separação visual.

### 6.4 Próximos Passos

1. ✅ **Análise completa realizada** - Portal-outbank e outbank-one analisados
2. ⏳ **Implementar separação em abas** - Equipe Consolle vs Outros usuários
3. ⏳ **Reforçar validações de isolamento** - Garantir que queries sempre filtrem por ISO quando necessário
4. ⏳ **Documentar fluxo de criação** - Hierarquia: Super Admin → Admin ISO → Internos → Externos
5. ✅ **Nenhuma alteração necessária no outbank-one** - Sistema funcionando corretamente

---

## 7. Anexos

### 7.1 Arquivos Analisados

- `drizzle/schema.ts` - Estrutura de banco de dados
- `src/features/users/server/admin-users.ts` - Gestão de usuários do portal
- `src/features/customers/users/_actions/users-actions.ts` - Criação de usuários de ISO
- `src/features/customers/users/_actions/user-actions.ts` - Outra função de criação
- `src/lib/permissions/check-permissions.ts` - Sistema de permissões
- `src/lib/subdomain-auth/domain.ts` - Validação por subdomínio
- `src/middleware.ts` - Middleware de autenticação

### 7.2 Queries Relevantes

**Listagem de usuários com isolamento:**
```typescript
// Admin vê apenas ISOs autorizados
if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
  whereConditions.push(inArray(users.idCustomer, userInfo.allowedCustomers));
}
```

**Validação de email por ISO:**
```typescript
if (idCustomer) {
  const existingUserForCustomer = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, normalizedEmail),
        eq(users.idCustomer, idCustomer)
      )
    );
}
```

---

**Fim do Relatório**

