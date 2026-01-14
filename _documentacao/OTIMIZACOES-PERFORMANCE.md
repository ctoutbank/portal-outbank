# Otimizações de Performance - Portal OutBank

**Data:** 14 de Janeiro de 2026

## Resumo das Otimizações Implementadas

Este documento descreve todas as otimizações de performance implementadas no portal OutBank.

---

## 1. Configuração do Next.js (`next.config.ts`)

### Alterações:
- **Bundle Analyzer**: Adicionado `@next/bundle-analyzer` para análise de bundle
- **Formatos de Imagem**: Habilitados AVIF e WebP para melhor compressão
- **Cache de Imagens**: Configurado TTL de 24 horas
- **Tree Shaking Automático**: Otimização de imports para `lucide-react`, `recharts`, `date-fns`
- **Compressão**: Habilitada compressão gzip
- **Headers de Cache**: Assets estáticos com cache de 1 ano (immutable)

```typescript
experimental: {
  optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', '@radix-ui/react-icons'],
}
```

---

## 2. Loading States (Skeletons)

Criados arquivos `loading.tsx` para todas as páginas principais:

| Página | Arquivo |
|--------|---------|
| Dashboard | `src/app/dashboard/loading.tsx` |
| BI | `src/app/bi/loading.tsx` |
| Transactions | `src/app/transactions/loading.tsx` |
| Merchants | `src/app/merchants/loading.tsx` |
| Merchant Detail | `src/app/merchants/[id]/loading.tsx` |
| Fechamento | `src/app/fechamento/loading.tsx` |
| Customers | `src/app/customers/loading.tsx` |

### Benefícios:
- Usuário vê feedback visual imediato
- Melhora percepção de velocidade
- Evita "flash" de conteúdo vazio

---

## 3. Lazy Loading de Componentes

### 3.1 Página BI (`src/features/bi/components/bi-dashboard.tsx`)

Todos os layers do BI agora são carregados sob demanda:

```typescript
const ExecutiveLayer = dynamic(() => import("./layers/executive-layer")...);
const FinancialLayer = dynamic(() => import("./layers/financial-layer")...);
const BrandProductLayer = dynamic(() => import("./layers/brand-product-layer")...);
const TemporalLayer = dynamic(() => import("./layers/temporal-layer")...);
const ConversionLayer = dynamic(() => import("./layers/conversion-layer")...);
const CommercialLayer = dynamic(() => import("./layers/commercial-layer")...);
```

**Resultado:** Página BI reduziu de ~9.64 kB para 4.62 kB no first load.

### 3.2 Página Merchant Detail (`src/features/merchants/_components/merchant-tabs.tsx`)

Todos os formulários de tabs são lazy loaded:

```typescript
const MerchantFormCompany = dynamic(() => import("./merchant-form-company")...);
const MerchantFormcontact = dynamic(() => import("./merchant-form-contact")...);
const MerchantFormOperations = dynamic(() => import("./merchant-form-operation")...);
// ... etc
```

---

## 4. Paralelização de Queries SQL

### 4.1 API Dashboard (`src/app/api/dashboard/route.ts`)

```typescript
const [
  merchantsCountResult,
  merchantsByIsoResult,
  transactionStatsResult
] = await Promise.all([
  sql.query(...),
  sql.query(...),
  sql.query(...)
]);
```

### 4.2 API BI (`src/app/api/bi/route.ts`)

Já estava otimizada com 14 queries paralelas. Adicionado log de performance.

---

## 5. Paralelização do Layout Root (`src/app/layout.tsx`)

Antes (sequencial):
```typescript
const tenantCustomization = await getCurrentTenantCustomization();
const isAdmin = await isAdminOrSuperAdmin();
const hasMerchants = await hasMerchantsAccess();
// ... 4 mais chamadas sequenciais
```

Depois (paralelo):
```typescript
const [
  tenantCustomization,
  isAdmin,
  hasMerchants,
  isCore,
  authorizedMenus,
  userCategoryLabel,
  superAdmin
] = await Promise.all([
  getCurrentTenantCustomization(),
  isAdminOrSuperAdmin(),
  hasMerchantsAccess(),
  isCoreProfile(),
  getUserAuthorizedMenus(),
  getUserCategoryLabel(),
  isSuperAdmin()
]);
```

**Impacto:** Afeta TODAS as páginas do portal. Redução estimada de 100-500ms por request.

---

## 6. Cache com Revalidate

Adicionado em APIs críticas:

```typescript
// API Dashboard
export const revalidate = 60; // 60 segundos

// API BI
export const revalidate = 60;
```

---

## 7. Métricas do Build (Antes vs Depois)

| Página | Tamanho Antes | Tamanho Depois | Redução |
|--------|---------------|----------------|---------|
| BI | 9.64 kB | 4.62 kB | -52% |
| Dashboard | 1.88 kB | 1.88 kB | - |
| Transactions | 264 kB | 264 kB | - |
| Merchants [id] | 110 kB | 112 kB | +2% (lazy loading overhead) |

**Nota:** O aumento em Merchants [id] é esperado devido ao código de lazy loading, mas o carregamento inicial é mais rápido pois os formulários só são carregados quando necessário.

---

## 8. Logs de Performance Adicionados

Para monitoramento contínuo:

```
[Layout] Permissões carregadas em paralelo: XXms
[Dashboard API] Queries paralelas executadas em XXms
[BI API] 14 queries paralelas executadas em XXms
[Login API] getUserByEmail took: XXms
[Login API] verifyPassword took: XXms
```

---

## 9. Próximas Otimizações Recomendadas

1. **Transactions (264 kB)**: 
   - Virtualização da tabela com `react-window`
   - Lazy load dos filtros avançados

2. **Recharts (~50kB)**:
   - Considerar migração para `lightweight-charts` ou `visx`

3. **Índices SQL**:
   - Já criado índice em `users.email`
   - Considerar índices em `transactions.slug_customer`, `merchants.slug_customer`

4. **Edge Runtime**:
   - Avaliar migração de APIs para Edge Runtime (menor latência)

---

## Como Verificar Performance

### Bundle Analyzer
```bash
ANALYZE=true npm run build
```
Abre relatório no navegador mostrando composição do bundle.

### Logs de Performance
Verificar no console do Vercel:
- `[Layout]` - Tempo de carregamento de permissões
- `[Dashboard API]` - Tempo das queries do dashboard
- `[BI API]` - Tempo das queries do BI

### Lighthouse
1. Abrir Chrome DevTools
2. Tab "Lighthouse"
3. Rodar auditoria de Performance
