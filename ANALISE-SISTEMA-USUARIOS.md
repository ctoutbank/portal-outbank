# Analise Profunda: Sistema de Usuarios Portal-Outbank e Outbank-One

## 1. Mapeamento: Documento vs Implementacao Atual

| Conceito do Documento | Portal-Outbank | Outbank-One | Status |
|----------------------|----------------|-------------|--------|
| `is_super_admin` boolean | Perfil com nome "SUPER" | Perfil com nome "SUPER" | IMPLEMENTADO |
| `user_iso_links` | `admin_customers` + `profile_customers` + `users.idCustomer` | `users.idCustomer` (single-tenant) | IMPLEMENTADO (helper getUserLinkedIsos) |
| `user_permissions` | `profile_functions` + `functions` | `profile_functions` + `functions` | IMPLEMENTADO (helper getUserPermissions) |
| Interface com Abas | Abas "Portal" e "ISOs" | N/A | IMPLEMENTADO |
| `is_invisible` | Existe (`users.is_invisible`) | Nao existe | PARCIAL |
| Super Admin acesso total | Implementado (PR #86) | Implementado (PR #187) | IMPLEMENTADO |

## 2. Estrutura de Tabelas Atual

### Portal-Outbank
```
users
  - id, email, idClerk, idCustomer, idProfile, fullAccess, active, is_invisible

profiles
  - id, name, description, active, restrictCustomerData

admin_customers (vinculacao admin -> ISOs)
  - id, idUser, idCustomer, active

profile_customers (vinculacao perfil -> ISOs)
  - id, idProfile, idCustomer, active

profile_functions (permissoes do perfil)
  - id, idProfile, idFunctions, active

functions (catalogo de permissoes)
  - id, name, group, active
```

### Outbank-One
```
users
  - id, email, idClerk, idCustomer, idProfile, fullAccess, active

profiles
  - id, name, description, active, isSalesAgent

user_merchants (acesso granular a merchants)
  - id, idUser, idMerchant, active

profile_functions + functions (mesma estrutura do portal)
```

## 3. Helpers de Permissao Existentes

### Portal-Outbank (`src/lib/permissions/check-permissions.ts`)
- `isSuperAdmin()` - verifica se perfil contem "SUPER"
- `isAdminUser()` - verifica se perfil contem "ADMIN" mas nao "SUPER"
- `getCurrentUserInfo()` - retorna dados do usuario + allowedCustomers
- `hasPermission(functionName)` - verifica permissao especifica
- `checkPagePermission(group, permission)` - verifica permissoes de pagina

### Outbank-One (`src/features/users/server/users.ts`)
- `isSuperAdminByClerkId(clerkId)` - verifica se perfil contem "SUPER"
- `getUserMerchantsAccess()` - retorna fullAccess + idMerchants + idCustomer
- `getUserGroupPermissions(userSlug, group)` - retorna permissoes do grupo
- `getCustomerIdByTentant()` - busca customer pelo subdominio

## 4. Gaps e Inconsistencias Identificados

### 4.1 Interface de Gerenciamento
- **Problema**: Nao existe separacao visual entre usuarios do portal e usuarios dos ISOs
- **Impacto**: Confusao ao gerenciar usuarios de diferentes contextos
- **Solucao**: Implementar interface com abas conforme documento

### 4.2 Campo is_invisible
- **Problema**: Existe apenas no portal-outbank, nao no outbank-one
- **Impacto**: Super admins podem aparecer na lista de usuarios dos ISOs
- **Solucao**: Adicionar campo no outbank-one e filtrar usuarios invisiveis

### 4.3 Sincronizacao de Usuarios
- **Problema**: Usuario criado no portal precisa ser criado manualmente no ISO
- **Impacto**: Trabalho duplicado e possibilidade de inconsistencias
- **Solucao**: Documentar fluxo e considerar sincronizacao automatica futura

### 4.4 Permissoes por Usuario vs Perfil
- **Problema**: Documento propoe permissoes por usuario, sistema usa por perfil
- **Impacto**: Menor flexibilidade para casos especificos
- **Solucao**: Manter sistema atual (perfis sao suficientes), documentar como "templates"

## 5. Implementacao Realizada

### FASE 1 - Padronizacao - CONCLUIDA
1. Exportado `isSuperAdminByClerkId()` no outbank-one para uso em outros modulos
2. Adicionados logs de debug com prefixos para rastrear decisoes de permissao
3. Ambos os sistemas usam a mesma logica para Super Admin (perfil contem "SUPER_ADMIN" ou "SUPER")

### FASE 2 - Abstracoes de Alto Nivel - CONCLUIDA
1. Criado helper `getUserLinkedIsos(userId)` no portal-outbank
   - Retorna array de ISOs vinculados ao usuario (admin_customers + profile_customers + users.idCustomer)
   - Super Admin retorna todos os ISOs ativos automaticamente
2. Criado helper `getUserPermissions(userId, group)` no portal-outbank
   - Encapsula logica de profile_functions
   - Super Admin retorna todas as permissoes do grupo automaticamente
3. Criado helper `isSuperAdminById(userId)` no portal-outbank
   - Verifica Super Admin por ID do usuario (complementa isSuperAdmin que usa Clerk)

### FASE 3 - Interface com Abas - CONCLUIDA
1. Adicionado componente Tabs na pagina `/config/users`
2. Aba "Usuarios do Portal": usuarios sem idCustomer (administradores do portal)
3. Aba "Usuarios dos ISOs": usuarios com idCustomer (usuarios de ISOs especificos)
4. Filtros existentes mantidos e funcionando em ambas as abas
5. Contadores de usuarios em cada aba para facilitar visualizacao

### FASE 4 - Documentacao - CONCLUIDA
1. Documento de analise atualizado com status de implementacao
2. Helpers documentados com JSDoc e logs de debug
3. Fluxos de permissao centralizados e consistentes

## 6. Helpers Implementados

### Portal-Outbank (`src/lib/permissions/check-permissions.ts`)
```typescript
// Retorna ISOs vinculados ao usuario
getUserLinkedIsos(userId: number): Promise<{ id: number; name: string | null; slug: string }[]>

// Retorna permissoes do usuario para um grupo
getUserPermissions(userId: number, group: string): Promise<string[]>

// Verifica se usuario e Super Admin por ID
isSuperAdminById(userId: number): Promise<boolean>
```

### Outbank-One (`src/features/users/server/users.ts`)
```typescript
// Verifica se usuario e Super Admin por Clerk ID (exportado)
isSuperAdminByClerkId(clerkId: string): Promise<boolean>

// Wrapper que usa currentUser() automaticamente
isSuperAdmin(): Promise<boolean>
```

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Quebrar login existente | Baixa | Alto | Testado em preview antes de merge |
| Usuarios perderem acesso | Baixa | Alto | Schema de permissoes nao alterado |
| Inconsistencia entre sistemas | Baixa | Medio | Mesma logica de Super Admin em ambos |

## 8. Status Final

- [x] FASE 1 - Padronizacao - CONCLUIDA
- [x] FASE 2 - Abstracoes - CONCLUIDA
- [x] FASE 3 - Interface com Abas - CONCLUIDA
- [x] FASE 4 - Documentacao - CONCLUIDA

---
*Documento atualizado em: 2025-12-04*
*Autor: Devin AI*
*Sessao: https://app.devin.ai/sessions/5bd6ca8960b848caa7542ad559b0e047*
