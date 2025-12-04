# Documentacao Completa: Sistema de Usuarios Portal-Outbank e Outbank-One

Este documento descreve toda a estrutura de usuarios, permissoes e relacoes entre os sistemas portal-outbank e outbank-one.

---

## 1. Visao Geral da Arquitetura

O sistema de usuarios e dividido em dois ambientes principais:

### 1.1 Portal-Outbank (Administracao Central)
- **URL**: https://portal-outbank.vercel.app
- **Proposito**: Gerenciamento centralizado de ISOs, usuarios e configuracoes
- **Autenticacao**: Clerk (instancia `internal-giraffe-9`)
- **Banco de Dados**: Neon PostgreSQL (compartilhado com outbank-one)

### 1.2 Outbank-One (ISOs Individuais)
- **URL**: https://{slug-iso}.consolle.one (ex: bancoprisma.consolle.one)
- **Proposito**: Operacao diaria de cada ISO (transacoes, merchants, fechamento)
- **Autenticacao**: Clerk (instancia `driven-pipefish-62`)
- **Banco de Dados**: Neon PostgreSQL (compartilhado com portal-outbank)

---

## 2. Tipos de Usuarios

### 2.1 Super Admin
- **Identificacao**: Perfil com nome contendo "SUPER_ADMIN" ou "SUPER"
- **Acesso**: TODOS os ISOs automaticamente, sem necessidade de cadastro individual
- **Permissoes**: TODAS as permissoes de todos os grupos
- **Visibilidade**: Pode ser marcado como "invisivel" para nao aparecer na lista de usuarios dos ISOs
- **Exemplo**: cto@outbank.com.br

### 2.2 Admin (Administrador do Portal)
- **Identificacao**: Perfil com nome contendo "ADMIN" (mas nao "SUPER")
- **Acesso**: Apenas ISOs vinculados via `admin_customers` ou `profile_customers`
- **Permissoes**: Definidas pelo perfil via `profile_functions`
- **Visibilidade**: Aparece na aba "Usuarios do Portal" em /config/users

### 2.3 Usuario de ISO
- **Identificacao**: Usuario com `id_customer` preenchido
- **Acesso**: Apenas o ISO ao qual esta vinculado
- **Permissoes**: Definidas pelo perfil via `profile_functions`
- **Visibilidade**: Aparece na aba "Usuarios dos ISOs" em /config/users

### 2.4 Usuario Consultor (Sales Agent)
- **Identificacao**: Perfil com `is_sales_agent = true`
- **Acesso**: Merchants especificos vinculados via `user_merchants`
- **Permissoes**: Limitadas a funcoes de vendas

---

## 3. Estrutura de Tabelas

### 3.1 Tabela `users` (Principal)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  slug VARCHAR(50),
  email VARCHAR(50),
  id_clerk VARCHAR(100),        -- ID do usuario no Clerk
  id_customer BIGINT,           -- ISO ao qual pertence (NULL = usuario do portal)
  id_profile BIGINT,            -- Perfil de permissoes
  full_access BOOLEAN,          -- Acesso total a todos os merchants
  is_invisible BOOLEAN,         -- Se TRUE, nao aparece na lista de usuarios do ISO
  hashed_password VARCHAR(100), -- Senha hasheada (para ISOs)
  initial_password TEXT,        -- Senha inicial (temporaria)
  active BOOLEAN,
  dtinsert TIMESTAMP,
  dtupdate TIMESTAMP
);
```

**Campos importantes:**
- `id_customer`: Se NULL, usuario pertence ao portal. Se preenchido, pertence ao ISO especifico.
- `is_invisible`: Super Admins e usuarios especiais podem ser marcados como invisiveis para nao aparecerem na lista de usuarios do ISO.
- `full_access`: Se TRUE, usuario tem acesso a todos os merchants do ISO.

### 3.2 Tabela `profiles` (Perfis de Permissao)
```sql
CREATE TABLE profiles (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),            -- Nome do perfil (ex: "SUPER_ADMIN", "ADMIN", "OPERADOR")
  description TEXT,
  active BOOLEAN,
  restrict_customer_data BOOLEAN,
  is_sales_agent BOOLEAN        -- Se TRUE, perfil e de consultor de vendas
);
```

**Perfis especiais:**
- Nome contendo "SUPER_ADMIN" ou "SUPER" = Super Admin
- Nome contendo "ADMIN" (sem "SUPER") = Administrador
- `is_sales_agent = true` = Consultor de vendas

### 3.3 Tabela `customers` (ISOs)
```sql
CREATE TABLE customers (
  id BIGINT PRIMARY KEY,
  slug VARCHAR(50),             -- Identificador unico (ex: "bancoprisma")
  name VARCHAR(255),            -- Nome do ISO
  customer_id VARCHAR(100),     -- ID externo (Dock)
  is_active BOOLEAN,
  id_parent BIGINT              -- ISO pai (para hierarquia)
);
```

### 3.4 Tabela `admin_customers` (Vinculacao Admin -> ISOs)
```sql
CREATE TABLE admin_customers (
  id BIGINT PRIMARY KEY,
  id_user BIGINT,               -- Usuario admin
  id_customer BIGINT,           -- ISO autorizado
  active BOOLEAN,
  UNIQUE(id_user, id_customer)
);
```

**Uso**: Permite que um Admin do portal tenha acesso a multiplos ISOs especificos.

### 3.5 Tabela `profile_customers` (Vinculacao Perfil -> ISOs)
```sql
CREATE TABLE profile_customers (
  id BIGINT PRIMARY KEY,
  id_profile BIGINT,            -- Perfil
  id_customer BIGINT,           -- ISO autorizado
  active BOOLEAN
);
```

**Uso**: Todos os usuarios com este perfil terao acesso aos ISOs vinculados.

### 3.6 Tabela `functions` (Catalogo de Permissoes)
```sql
CREATE TABLE functions (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),            -- Nome da permissao (ex: "view_transactions")
  "group" VARCHAR(150),         -- Grupo da permissao (ex: "transactions", "merchants")
  active BOOLEAN
);
```

### 3.7 Tabela `profile_functions` (Permissoes do Perfil)
```sql
CREATE TABLE profile_functions (
  id BIGINT PRIMARY KEY,
  id_profile BIGINT,            -- Perfil
  id_functions BIGINT,          -- Permissao
  active BOOLEAN
);
```

**Uso**: Define quais permissoes cada perfil possui.

### 3.8 Tabela `user_merchants` (Acesso Granular a Merchants)
```sql
CREATE TABLE user_merchants (
  id BIGINT PRIMARY KEY,
  id_user BIGINT,               -- Usuario
  id_merchant BIGINT,           -- Merchant especifico
  active BOOLEAN
);
```

**Uso**: Para usuarios sem `full_access`, define quais merchants podem acessar.

---

## 4. Fluxo de Autenticacao

### 4.1 Login no Portal-Outbank
```
1. Usuario acessa portal-outbank.vercel.app
2. Clerk (internal-giraffe-9) autentica o usuario
3. Sistema busca usuario no banco pelo id_clerk
4. Verifica perfil para determinar nivel de acesso:
   - Super Admin: acesso total
   - Admin: acesso aos ISOs vinculados
   - Usuario comum: acesso limitado
```

### 4.2 Login no ISO (Outbank-One)
```
1. Usuario acessa {slug}.consolle.one/auth/sign-in
2. Sistema valida subdominio e busca customer pelo slug
3. Clerk (driven-pipefish-62) autentica o usuario
4. Sistema verifica:
   a) Se usuario e Super Admin -> acesso total
   b) Se usuario pertence ao ISO (id_customer) -> acesso normal
   c) Se usuario nao pertence -> acesso negado
5. Se primeiro login, redireciona para criacao de senha
```

### 4.3 Super Admin em Qualquer ISO
```
1. Super Admin acessa qualquer {slug}.consolle.one
2. Sistema detecta que perfil contem "SUPER" ou "SUPER_ADMIN"
3. Acesso e concedido automaticamente, mesmo sem cadastro no ISO
4. Se is_invisible = true, usuario nao aparece na lista de usuarios do ISO
```

---

## 5. Helpers de Permissao

### 5.1 Portal-Outbank (`src/lib/permissions/check-permissions.ts`)

```typescript
// Verifica se usuario atual e Super Admin
isSuperAdmin(): Promise<boolean>

// Verifica se usuario atual e Admin (mas nao Super)
isAdminUser(): Promise<boolean>

// Retorna informacoes completas do usuario atual
getCurrentUserInfo(): Promise<{
  id: number;
  email: string;
  idCustomer: number | null;
  idProfile: number | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  allowedCustomers: number[];
}>

// Verifica se usuario tem permissao especifica
hasPermission(functionName: string): Promise<boolean>

// Verifica permissoes de pagina
checkPagePermission(group: string, permission: string): Promise<boolean>

// Retorna ISOs vinculados ao usuario
getUserLinkedIsos(userId: number): Promise<{ id: number; name: string; slug: string }[]>

// Retorna permissoes do usuario para um grupo
getUserPermissions(userId: number, group: string): Promise<string[]>

// Verifica Super Admin por ID do banco
isSuperAdminById(userId: number): Promise<boolean>
```

### 5.2 Outbank-One (`src/features/users/server/users.ts`)

```typescript
// Verifica Super Admin por Clerk ID (exportado)
isSuperAdminByClerkId(clerkId: string): Promise<boolean>

// Verifica se usuario atual e Super Admin
isSuperAdmin(): Promise<boolean>

// Retorna acesso a merchants do usuario
getUserMerchantsAccess(): Promise<{
  fullAccess: boolean;
  idMerchants: number[];
  idCustomer: number;
}>

// Retorna permissoes do usuario para um grupo
getUserGroupPermissions(userSlug: string, group: string): Promise<string[]>

// Busca customer pelo subdominio
getCustomerIdByTentant(): Promise<number | null>
```

---

## 6. Interface de Gerenciamento de Usuarios

### 6.1 Pagina /config/users (Portal-Outbank)

A pagina possui duas abas:

**Aba "Usuarios do Portal"**
- Mostra usuarios com `id_customer = NULL`
- Sao administradores do portal que gerenciam ISOs
- Super Admins aparecem aqui

**Aba "Usuarios dos ISOs"**
- Mostra usuarios com `id_customer IS NOT NULL`
- Sao usuarios vinculados a ISOs especificos
- Cada usuario pertence a um unico ISO

### 6.2 Criacao de Usuario

Ao criar um usuario no portal, pode-se:
1. Definir o perfil (que determina permissoes)
2. Vincular a ISOs especificos (via admin_customers)
3. Marcar como "invisivel" (is_invisible = true)

**Opcao "Ocultar Usuario"**:
- Se marcada, usuario pode acessar ISOs sem aparecer na lista de usuarios
- Util para Super Admins e auditores
- Campo: `is_invisible = true`

---

## 7. Regras de Negocio

### 7.1 Super Admin
- Perfil com nome contendo "SUPER_ADMIN" ou "SUPER"
- Acesso automatico a TODOS os ISOs
- Todas as permissoes de todos os grupos
- Pode ser marcado como invisivel

### 7.2 Acesso a ISOs
Um usuario tem acesso a um ISO se:
1. E Super Admin (acesso a todos), OU
2. `id_customer` do usuario = ID do ISO, OU
3. Existe registro em `admin_customers` vinculando usuario ao ISO, OU
4. Perfil do usuario esta vinculado ao ISO via `profile_customers`

### 7.3 Permissoes
Um usuario tem uma permissao se:
1. E Super Admin (todas as permissoes), OU
2. Perfil do usuario tem a permissao via `profile_functions`

### 7.4 Acesso a Merchants
Um usuario tem acesso a um merchant se:
1. E Super Admin (todos os merchants), OU
2. `full_access = true` (todos os merchants do ISO), OU
3. Existe registro em `user_merchants` vinculando usuario ao merchant

---

## 8. Fluxos Comuns

### 8.1 Criar Usuario do Portal
```
1. Admin acessa /config/users/new
2. Preenche dados (nome, email, perfil)
3. Seleciona ISOs autorizados (se nao for Super Admin)
4. Marca "Ocultar usuario" se necessario
5. Sistema cria usuario no Clerk e no banco
6. Usuario recebe email com credenciais
```

### 8.2 Criar Usuario de ISO
```
1. Admin acessa /config/users/new
2. Preenche dados e seleciona o ISO
3. Sistema cria usuario no Clerk e no banco
4. Usuario aparece na lista do ISO (se nao for invisivel)
5. Usuario pode acessar {slug}.consolle.one
```

### 8.3 Super Admin Acessando ISO
```
1. Super Admin acessa {slug}.consolle.one
2. Sistema detecta perfil "SUPER" ou "SUPER_ADMIN"
3. Acesso concedido automaticamente
4. Se is_invisible = true, nao aparece na lista de usuarios
5. Tem acesso a todas as funcionalidades
```

---

## 9. Troubleshooting

### 9.1 Usuario nao consegue fazer login no ISO
1. Verificar se usuario existe no banco com email correto
2. Verificar se id_clerk esta atualizado
3. Verificar se usuario pertence ao ISO ou e Super Admin
4. Verificar se senha foi criada no Clerk

### 9.2 Usuario nao ve todos os ISOs
1. Verificar se e Super Admin (perfil com "SUPER")
2. Verificar registros em admin_customers
3. Verificar registros em profile_customers

### 9.3 Usuario nao tem permissao para funcionalidade
1. Verificar perfil do usuario
2. Verificar profile_functions do perfil
3. Se Super Admin, verificar se funcao isSuperAdmin esta funcionando

### 9.4 Super Admin aparece na lista de usuarios do ISO
1. Verificar campo is_invisible do usuario
2. Se is_invisible = false, marcar como true

---

## 10. Diagrama de Relacionamentos

```
                    +-------------+
                    |   profiles  |
                    +-------------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
    +-----------+   +-------------+   +------------------+
    |   users   |   | profile_    |   | profile_         |
    +-----------+   | functions   |   | customers        |
          |         +-------------+   +------------------+
          |               |                   |
          |               v                   |
          |         +-----------+             |
          |         | functions |             |
          |         +-----------+             |
          |                                   |
          +-----------------------------------+
          |               |
          v               v
    +-------------+   +-------------+
    | admin_      |   | customers   |
    | customers   |   | (ISOs)      |
    +-------------+   +-------------+
          |               |
          +-------+-------+
                  |
                  v
          +---------------+
          | user_merchants|
          +---------------+
                  |
                  v
          +-------------+
          |  merchants  |
          +-------------+
```

---

## 11. Consideracoes de Seguranca

1. **Senhas**: Armazenadas com hash no campo `hashed_password`
2. **Clerk**: Autenticacao gerenciada externamente
3. **Isolamento**: Usuarios de ISO so veem dados do seu ISO
4. **Super Admin**: Acesso total, usar com cuidado
5. **Invisibilidade**: Permite auditoria sem conhecimento do ISO

---

*Documento gerado em: 2025-12-04*
*Autor: Devin AI*
*Sessao: https://app.devin.ai/sessions/5bd6ca8960b848caa7542ad559b0e047*
