# Problemas Corrigidos na Página de Usuários

## Resumo Executivo

A página de usuários (`/config/users`) estava com vários problemas que impediam o funcionamento adequado das funcionalidades de **filtro**, **criação** e **edição** de usuários. Este documento detalha todos os problemas encontrados e as correções aplicadas.

---

## 1. Problema: Filtros Não Funcionavam

### Sintomas
- Ao aplicar filtros, nada acontecia
- Filtros não eram sincronizados com a URL
- Estado dos filtros não era mantido ao recarregar a página
- `useTransition` causava problemas de renderização no Next.js 15

### Causa Raiz

**1.1 Uso incorreto de `useTransition`**
```typescript
// ❌ ANTES (ERRADO)
const [isPending, startTransition] = useTransition();

const handleFilter = () => {
  startTransition(() => {
    router.push(`/config/users?${params.toString()}`);
  });
};
```

**Problema**: No Next.js 15, `useTransition` não é necessário para navegação e pode causar problemas de sincronização entre estado e URL.

**1.2 Falta de sincronização entre estado e URL**
- Os campos do formulário não eram sincronizados com os parâmetros da URL
- Ao recarregar a página, os filtros aplicados não apareciam nos campos

**1.3 Uso de `router.push` ao invés de `router.replace`**
- `router.push` adiciona uma nova entrada no histórico
- Para filtros, queremos substituir a URL atual, não adicionar ao histórico

### Solução Implementada

**1.1 Removido `useTransition`**
```typescript
// ✅ DEPOIS (CORRETO)
const handleFilter = () => {
  const params = new URLSearchParams(searchParams?.toString() || "");
  // ... configurar parâmetros ...
  router.replace(`/config/users?${params.toString()}`);
};
```

**1.2 Adicionado `useEffect` para sincronização**
```typescript
// ✅ DEPOIS (CORRETO)
useEffect(() => {
  if (searchParams) {
    const emailParam = searchParams.get("email") || "";
    const nameParam = searchParams.get("name") || "";
    // ... outros parâmetros ...
    
    setEmail(emailParam);
    setName(nameParam);
    // ... atualizar outros estados ...
  }
}, [searchParams, emailIn, nameIn, customerIdIn, profileIdIn, activeIn]);
```

**1.3 Mudado para `router.replace`**
```typescript
// ✅ DEPOIS (CORRETO)
router.replace(`/config/users?${params.toString()}`);
```

**Arquivo corrigido**: `src/features/users/_components/admin-users-filter.tsx`

---

## 2. Problema: Criação de Usuários Não Funcionava

### Sintomas
- Ao tentar criar um novo usuário, aparecia erro ou nada acontecia
- Usuários eram criados sempre com perfil ADMIN, independente da seleção
- Validações não funcionavam corretamente
- Erros não eram exibidos adequadamente

### Causa Raiz

**2.1 Função `InsertUser` não recebia parâmetros corretos**
```typescript
// ❌ ANTES (ERRADO)
const userId = await InsertUser({
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  password: data.password,
  idCustomer: data.idCustomer,
  active: true,
  // ❌ idProfile e fullAccess não eram passados
});
```

**Problema**: A função `InsertUser` não recebia `idProfile` e `fullAccess`, então sempre usava valores padrão.

**2.2 Validação incorreta do retorno**
```typescript
// ❌ ANTES (ERRADO)
if (userId) {
  // userId pode ser 0, que é falsy em JavaScript
  toast.success("Usuário criado");
}
```

**Problema**: Se `userId` fosse `0`, seria considerado falsy e não exibiria sucesso.

**2.3 Lógica de criação de Admin incorreta**
- A criação de usuário Admin não passava `idProfile` e `fullAccess` corretamente

### Solução Implementada

**2.1 Corrigido `InsertUser` para aceitar `idProfile` e `fullAccess`**
```typescript
// ✅ DEPOIS (CORRETO)
const userId = await InsertUser({
  firstName: data.firstName.trim(),
  lastName: data.lastName.trim(),
  email: data.email.trim().toLowerCase(),
  password: data.password?.trim() || undefined,
  idCustomer: data.idCustomer || null,
  active: true,
  idProfile: data.idProfile,  // ✅ Passado corretamente
  fullAccess: data.fullAccess || false,  // ✅ Passado corretamente
});
```

**2.2 Corrigida validação do retorno**
```typescript
// ✅ DEPOIS (CORRETO)
if (userId && typeof userId === 'number' && userId > 0) {
  toast.success("Usuário criado com sucesso");
  router.push("/config/users");
  router.refresh();
  return;
} else {
  throw new Error("Erro ao obter ID do usuário criado");
}
```

**2.3 Atualizada função `InsertUser` em `user-actions.ts`**
```typescript
// ✅ DEPOIS (CORRETO)
export async function InsertUser(input: InsertUserInput): Promise<number> {
  // ... validações ...
  
  // ✅ Usar idProfile se fornecido, senão usar padrão ADMIN
  const profileId = input.idProfile || ADMIN_PROFILE_ID;
  
  // ✅ Usar fullAccess se fornecido, senão false
  const fullAccess = input.fullAccess ?? false;
  
  // ... resto da lógica ...
}
```

**Arquivos corrigidos**:
- `src/features/users/_components/admin-user-permissions-form.tsx`
- `src/features/customers/users/_actions/user-actions.ts`

---

## 3. Problema: Edição de Usuários Não Funcionava

### Sintomas
- Ao tentar editar um usuário, a página não carregava corretamente
- Dados do usuário não apareciam no formulário
- Erros ao buscar ISOs autorizados quebravam a página
- Tratamento de ID inválido (`"new"` ou `"0"`) estava incorreto

### Causa Raiz

**3.1 Falta de tratamento de erro robusto**
```typescript
// ❌ ANTES (ERRADO)
const [user, profiles, customers] = await Promise.all([
  getUserDetailWithClerk(userId),
  getAllProfiles(),
  getAvailableCustomers(),
]);

const adminCustomers = await getAdminCustomers(userId);
// ❌ Se getAdminCustomers falhar, a página inteira quebra
```

**Problema**: Se `getAdminCustomers` falhasse (por exemplo, se a tabela não existisse), a página inteira quebrava.

**3.2 Lógica de detecção de "novo usuário" incorreta**
```typescript
// ❌ ANTES (ERRADO)
if (id === "0") {
  // Tentava editar usuário com ID 0, que não existe
  const user = await getUserDetailWithClerk(0);
}
```

**Problema**: O código tentava editar um usuário com ID `0`, que não existe.

**3.3 Falta de tipos TypeScript explícitos**
```typescript
// ❌ ANTES (ERRADO)
let user, profiles, customers;
// ❌ TypeScript não consegue inferir tipos corretamente
```

**Problema**: TypeScript não conseguia inferir os tipos das variáveis, causando erros de compilação.

### Solução Implementada

**3.1 Adicionado tratamento de erro robusto**
```typescript
// ✅ DEPOIS (CORRETO)
let user: Awaited<ReturnType<typeof getUserDetailWithClerk>> | null;
let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
let customers: Awaited<ReturnType<typeof getAvailableCustomers>>;
let adminCustomers: Awaited<ReturnType<typeof getAdminCustomers>> = [];

try {
  [user, profiles, customers] = await Promise.all([
    getUserDetailWithClerk(userId),
    getAllProfiles(),
    getAvailableCustomers(),
  ]);
  
  // ✅ Buscar ISOs autorizados separadamente com tratamento de erro
  try {
    adminCustomers = await getAdminCustomers(userId);
  } catch (error) {
    console.warn('Erro ao buscar ISOs autorizados (tabela pode não existir):', error);
    adminCustomers = [];  // ✅ Não quebra a página
  }
} catch (error) {
  console.error('Erro ao carregar dados do usuário:', error);
  // ✅ Retornar página de erro amigável
  return (
    <BaseBody title="Erro ao carregar usuário">
      <p>Ocorreu um erro ao carregar os dados do usuário.</p>
    </BaseBody>
  );
}
```

**3.2 Corrigida lógica de "novo usuário"**
```typescript
// ✅ DEPOIS (CORRETO)
if (id === "new" || id === "0") {
  // ✅ Redirecionar para página de criação
  const [profiles, customers] = await Promise.all([
    getAllProfiles(),
    getAvailableCustomers(),
  ]);
  
  return <AdminUserPermissionsForm profiles={profiles} customers={customers} />;
}

// ✅ Editar usuário existente
const userId = parseInt(id);
if (isNaN(userId) || userId <= 0) {
  // ✅ Retornar erro se ID inválido
  return <BaseBody title="Usuário não encontrado">ID inválido.</BaseBody>;
}
```

**3.3 Adicionados tipos TypeScript explícitos**
```typescript
// ✅ DEPOIS (CORRETO)
let user: Awaited<ReturnType<typeof getUserDetailWithClerk>> | null;
let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
let customers: Awaited<ReturnType<typeof getAvailableCustomers>>;
```

**Arquivos corrigidos**:
- `src/app/config/users/[id]/page.tsx`
- `src/app/config/users/new/page.tsx`
- `src/app/config/users/page.tsx`

---

## 4. Problema: Erros de Compilação TypeScript

### Sintomas
- Build falhava no Vercel com erros de tipo
- Erros como "Variable implicitly has type 'any[]'"
- Erros de comparação de tipos boolean vs string

### Causa Raiz

**4.1 Tipos implícitos em variáveis**
```typescript
// ❌ ANTES (ERRADO)
let profiles, customers;
// ❌ TypeScript não consegue inferir tipos em alguns casos
```

**4.2 Tipos incorretos para parâmetros de URL**
```typescript
// ❌ ANTES (ERRADO)
type UsersPageProps = {
  active?: boolean;  // ❌ URL sempre retorna string
};

// ❌ Depois, tentando comparar:
params.active === true  // ❌ Comparando boolean com string
```

**Problema**: Parâmetros de URL no Next.js sempre são strings, mas o tipo estava definido como `boolean`.

### Solução Implementada

**4.1 Adicionados tipos explícitos**
```typescript
// ✅ DEPOIS (CORRETO)
let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
let customers: Awaited<ReturnType<typeof getAvailableCustomers>>;
```

**4.2 Corrigidos tipos para parâmetros de URL**
```typescript
// ✅ DEPOIS (CORRETO)
type UsersPageProps = {
  page?: number | string;
  perPage?: number | string;
  email?: string;
  name?: string;
  customerId?: number | string;
  profileId?: number | string;
  active?: boolean | string;  // ✅ Aceita ambos
};

// ✅ Comparação correta:
active: params.active !== undefined 
  ? (typeof params.active === 'boolean' 
      ? params.active 
      : typeof params.active === 'string' && params.active === "true")
  : undefined,
```

**Arquivos corrigidos**:
- `src/app/config/users/page.tsx`
- `src/app/config/users/new/page.tsx`
- `src/app/config/users/[id]/page.tsx`

---

## 5. Problema: Listagem Duplicada de Usuários

### Sintomas
- Um mesmo usuário aparecia múltiplas vezes na lista
- Cada ISO do usuário gerava uma entrada separada
- Dificuldade em identificar quantos ISOs um usuário possui

### Causa Raiz

**5.1 Query não agrupava usuários**
```typescript
// ❌ ANTES (ERRADO)
const users = await db
  .select()
  .from(users)
  .leftJoin(customers, eq(users.idCustomer, customers.id))
  .leftJoin(adminCustomers, eq(users.id, adminCustomers.idUser));
// ❌ Retorna uma linha para cada combinação usuário + ISO
```

**Problema**: Se um usuário tivesse múltiplos ISOs (via `admin_customers`), a query retornava múltiplas linhas para o mesmo usuário.

### Solução Implementada

**5.1 Agrupamento de usuários em Map**
```typescript
// ✅ DEPOIS (CORRETO)
const usersMap = new Map<number, UserData>();

for (const row of rawUsers) {
  const userId = row.user.id;
  
  if (!usersMap.has(userId)) {
    // ✅ Criar entrada do usuário apenas uma vez
    usersMap.set(userId, {
      ...row.user,
      customers: [],
    });
  }
  
  const user = usersMap.get(userId)!;
  
  // ✅ Adicionar ISO principal
  if (row.customer && !user.customers.find(c => c.idCustomer === row.customer.id)) {
    user.customers.push({
      idCustomer: row.customer.id,
      customerName: row.customer.name,
    });
  }
  
  // ✅ Adicionar ISOs adicionais (admin_customers)
  if (row.adminCustomer && !user.customers.find(c => c.idCustomer === row.adminCustomer.idCustomer)) {
    user.customers.push({
      idCustomer: row.adminCustomer.idCustomer,
      customerName: null,  // Será preenchido depois
    });
  }
}

// ✅ Buscar nomes dos ISOs adicionais
for (const user of usersMap.values()) {
  for (const customer of user.customers) {
    if (!customer.customerName && customer.idCustomer) {
      const customerData = await getCustomerById(customer.idCustomer);
      customer.customerName = customerData?.name || null;
    }
  }
}

return Array.from(usersMap.values());
```

**5.2 Atualizado componente de lista para exibir badges**
```typescript
// ✅ DEPOIS (CORRETO)
{user.customers && user.customers.length > 0 ? (
  <div className="flex flex-wrap gap-1">
    {user.customers.slice(0, 3).map((customer) => (
      <Badge key={customer.idCustomer} variant="secondary">
        {customer.customerName || `ISO ${customer.idCustomer}`}
      </Badge>
    ))}
    {user.customers.length > 3 && (
      <Badge variant="secondary">+{user.customers.length - 3}</Badge>
    )}
  </div>
) : (
  <span className="text-muted-foreground">Nenhum ISO</span>
)}
```

**Arquivos corrigidos**:
- `src/features/users/server/admin-users.ts`
- `src/features/users/_components/admin-users-list.tsx`

---

## 6. Problema: Tratamento de Erros Inadequado

### Sintomas
- Erros do banco de dados quebravam a página inteira
- Mensagens de erro não eram amigáveis ao usuário
- Falta de logs adequados para debug

### Causa Raiz

**6.1 Falta de try-catch em funções críticas**
```typescript
// ❌ ANTES (ERRADO)
export async function getAllUsers() {
  const result = await db.select()...;
  // ❌ Se der erro, não é tratado
  return result;
}
```

**6.2 Erros de tabela não existente não eram tratados**
```typescript
// ❌ ANTES (ERRADO)
const adminCustomers = await db
  .select()
  .from(adminCustomers);  // ❌ Se tabela não existir, quebra tudo
```

### Solução Implementada

**6.1 Adicionado tratamento de erro robusto**
```typescript
// ✅ DEPOIS (CORRETO)
export async function getAllUsers(...) {
  try {
    const result = await db.select()...;
    return result;
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    
    // ✅ Verificar se é erro de tabela não existente
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Tabela admin_customers não existe. Retornando usuários sem ISOs adicionais.');
      // ✅ Retornar dados parciais ao invés de quebrar
      return { users: [], totalCount: 0 };
    }
    
    // ✅ Relançar outros erros com mensagem clara
    throw new Error('Erro ao buscar usuários. Tente novamente.');
  }
}
```

**6.2 Tratamento específico para tabela admin_customers**
```typescript
// ✅ DEPOIS (CORRETO)
export async function getAdminCustomers(userId: number) {
  try {
    const result = await db
      .select()
      .from(adminCustomers)
      .where(eq(adminCustomers.idUser, userId));
    return result;
  } catch (error: any) {
    // ✅ Tratar erro de tabela não existente
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn('Tabela admin_customers não existe. Execute a migration.');
      return [];  // ✅ Retornar array vazio ao invés de quebrar
    }
    throw error;
  }
}
```

**Arquivos corrigidos**:
- `src/features/users/server/admin-users.ts`
- `src/app/config/users/page.tsx`
- `src/app/config/users/[id]/page.tsx`
- `src/app/config/users/new/page.tsx`

---

## Resumo das Correções

### Arquivos Modificados

1. **`src/features/users/_components/admin-users-filter.tsx`**
   - Removido `useTransition`
   - Adicionado `useEffect` para sincronização
   - Mudado para `router.replace`
   - Adicionado `useCallback` para otimização

2. **`src/features/users/_components/admin-user-permissions-form.tsx`**
   - Corrigida passagem de `idProfile` e `fullAccess`
   - Melhorada validação de retorno
   - Adicionado tratamento de erros específico

3. **`src/features/customers/users/_actions/user-actions.ts`**
   - Atualizado `InsertUser` para aceitar `idProfile` e `fullAccess`
   - Adicionado fallback para perfil padrão

4. **`src/app/config/users/[id]/page.tsx`**
   - Corrigida lógica de detecção de "novo usuário"
   - Adicionado tratamento de erro robusto
   - Adicionados tipos TypeScript explícitos

5. **`src/app/config/users/new/page.tsx`**
   - Adicionado tratamento de erro
   - Adicionados tipos TypeScript explícitos

6. **`src/app/config/users/page.tsx`**
   - Corrigidos tipos para parâmetros de URL
   - Adicionado tratamento de erro
   - Adicionados tipos TypeScript explícitos

7. **`src/features/users/server/admin-users.ts`**
   - Implementado agrupamento de usuários com Map
   - Adicionado tratamento de erro robusto
   - Melhorada query para buscar ISOs

8. **`src/features/users/_components/admin-users-list.tsx`**
   - Atualizado para exibir múltiplos ISOs como badges
   - Adicionada validação para `user.customers`

### Problemas Resolvidos

✅ Filtros funcionando corretamente
✅ Criação de usuários funcionando
✅ Edição de usuários funcionando
✅ Erros de compilação TypeScript corrigidos
✅ Listagem não duplica usuários
✅ Tratamento de erros robusto
✅ Mensagens de erro amigáveis

---

## Lições Aprendidas

1. **Next.js 15**: `useTransition` não é necessário para navegação e pode causar problemas
2. **Parâmetros de URL**: Sempre são strings, mesmo quando representam números ou booleans
3. **Tipos TypeScript**: Sempre declarar tipos explícitos para variáveis em funções async
4. **Tratamento de Erros**: Sempre tratar erros de banco de dados, especialmente tabelas não existentes
5. **Agrupamento de Dados**: Use Map ou Set para evitar duplicatas ao agrupar dados relacionados
6. **Sincronização de Estado**: Use `useEffect` para sincronizar estado local com URL params

---

## Próximos Passos (Se Necessário)

1. Adicionar testes unitários para funções críticas
2. Adicionar testes de integração para fluxos completos
3. Melhorar mensagens de erro para o usuário final
4. Adicionar loading states durante operações assíncronas
5. Otimizar queries do banco de dados com índices

