# Análise de Migração - Portal Outbank para Base44

**Data:** 13 de Novembro de 2025  
**Aplicação:** Portal Outbank (Admin)  
**Repositório:** https://github.com/ctoutbank/portal-outbank  
**Deploy Atual:** https://portal-outbank.vercel.app/

---

## 1. Visão Geral da Aplicação

### Nome da Aplicação
**Portal Outbank** (Portal Administrativo Multi-tenant)

### Propósito Principal
Console administrativo multi-tenant para gestão completa de operações de adquirência de pagamentos. O portal gerencia múltiplos ISOs (Instituições de Pagamento), cada um representando um cliente/tenant independente com suas próprias operações, merchants, terminais, liquidações e configurações.

### Público-alvo
- **Administradores Internos:** Gestão de ISOs, configurações globais, usuários
- **Gestores de ISO:** Gerenciamento de merchants, terminais, taxas, relatórios
- **Consultores Comerciais:** Acompanhamento de vendas e estabelecimentos

### Arquitetura Multi-tenant
O sistema utiliza a tabela `customers` para representar cada ISO (tenant). Cada registro em `customers` é um ambiente isolado com:
- **Identificação:** `slug`, `customerId`, `name`
- **Hierarquia:** `idParent` (permite ISOs pai/filho)
- **Status:** `isActive` (controla visibilidade e acesso)
- **Tipo:** `settlementManagementType` (CIP, etc.)

A maioria das tabelas possui campos `slugCustomer` ou `idCustomer` para isolamento de dados por tenant.

---

## 2. Frontend Atual

### Framework/Biblioteca
- **Next.js 15.3.1** (App Router)
- **React 19.0.0**
- **TypeScript 5.x**

### Linguagem
TypeScript (100% do código frontend)

### Biblioteca de UI/CSS
- **Radix UI** - Componentes primitivos acessíveis
- **Tailwind CSS 4.1.5** - Estilização utility-first
- **shadcn/ui pattern** - Componentes customizados em `src/components/ui/`
- **Lucide React** - Ícones
- **class-variance-authority** - Variantes de componentes

### Estrutura de Componentes

**Páginas Principais:**
- `/` - Dashboard principal
- `/customers` - Lista de ISOs
- `/customers/[id]` - Detalhes de ISO
- `/categories` - CNAEs
- `/supplier` - Fornecedores
- `/solicitationfee` - Solicitações de taxas
- `/auth/sign-in` - Login (Clerk)

**Módulos de Features:**
- `customers/` - Gestão de ISOs
- `categories/` - Gestão de CNAEs
- `pricingSolicitation/` - Integrações Dock
- `solicitationfee/` - Gestão de taxas
- `users/` - Gestão de usuários

### Gerenciamento de Estado
- React Hook Form + Zod
- Server Actions (Next.js)
- Context API (limitado)

### Bibliotecas Adicionais
- recharts - Gráficos
- react-number-format - Máscaras
- luxon - Datas
- sonner - Notificações
- next-themes - Dark mode

---

## 3. Backend Atual

### Linguagem/Framework
- Node.js + Next.js 15.3.1 API Routes
- TypeScript 5.x

### Banco de Dados
- **PostgreSQL** (Neon/Vercel Postgres)
- **ORM:** Drizzle ORM 0.43.1
- **Driver:** @neondatabase/serverless + @vercel/postgres

### Estrutura da API

**Rotas API:**
```
GET/POST  /api/supplier
GET/PUT   /api/supplier/[id]
GET/POST  /api/supplier/[id]/documents
GET/POST  /api/supplier/[id]/cnae/[cnaeId]/mdr
GET       /api/cnaes
```

**Server Actions:**
- `customers/server/customers.ts` - CRUD de ISOs
- `categories/server/category.ts` - CRUD de CNAEs
- `pricingSolicitation/server/` - Integrações Dock

### Autenticação
- **Provider:** Clerk Authentication
- **Middleware:** Protege todas as rotas exceto `/auth/*`
- **Modelo:** users → profiles → functions

---

## 4. Modelos de Dados (Entidades)

### Resumo
- **Total de Tabelas:** 72
- **Total de Foreign Keys:** 65

### Entidades Principais

#### customers (ISOs/Tenants)
- `id`, `slug`, `name`, `customerId`
- `settlementManagementType`
- `idParent` (hierarquia)
- `isActive` (status)

#### merchants (Estabelecimentos)
- `id`, `slug`, `slugCustomer`
- `corporateName`, `tradingName`, `documentId`
- `idCategory`, `idSalesAgent`, `idConfiguration`
- Campos de taxas Dock

#### settlements (Liquidações)
- `id`, `slug`, `slugCustomer`
- `paymentDate`, status fields
- Valores monetários (batchAmount, netSettlementAmount, etc.)

#### payout (Pagamentos)
- `id`, `slug`, `slugCustomer`, `slugMerchant`
- `transactionDate`, `paymentDate`
- Valores e dados bancários

#### terminals (Terminais POS)
- `id`, `slug`, `slugCustomer`, `slugMerchant`
- `logicalNumber`, `serialNumber`
- `model`, `manufacturer`, `status`

#### users (Usuários)
- `id`, `slug`, `clerkId`, `email`
- `idProfile`, `slugCustomer`
- `cpf`, `phone`, `birthDate`

#### fornecedores (Fornecedores)
- `id` (uuid), `nome`, `cnpj`, `email`
- `cnaecodigo`, `ativo`

#### solicitationFee (Solicitações de Taxas)
- `id`, `slug`, `slugCustomer`, `slugMerchant`
- `status`, `requestDate`, `approvalDate`
- Taxas Dock

### Tabelas de Suporte
- Lookup: state, country, city, brand, productType, accountType, legalNatures
- Relacionamento: profile_functions, customer_functions, user_merchants
- Controle: syncLog, syncControl, cronJobMonitoring

---

## 5. Funcionalidades Chave

### 5.1. Gestão de ISOs (Multi-tenant Core)
Sistema completo de gerenciamento de ISOs com:
- Criar, listar, ativar, desativar, deletar ISOs
- Hierarquia de ISOs (parent/child)
- Customização por ISO
- Badges de status (Ativo/Inativo)

**Arquivos:** `src/features/customers/`

### 5.2. Sincronização com Dock API
8 módulos de sincronização automática:

**a) sync-merchant** - Merchants e dados relacionados
- Endpoint: `GET /v1/merchants?limit=40`

**b) sync-merchantPrice** - Preços
- Endpoint: `GET /v1/merchants/{slug}/merchant_prices`

**c) sync-merchantPriceGroup** - Grupos de preço
- Endpoint: `GET /v1/merchants/{slug}/merchant_prices/{slug}/merchant_price_groups`

**d) sync-terminals** - Terminais POS
- Endpoint: `GET /v1/terminals?limit=1000&offset={offset}`

**e) sync-transactions** - Transações
- Endpoint: `GET /v1/financial_transactions?limit=1000&offset={offset}`

**f) sync-settlements** - Liquidações
- Endpoints múltiplos: settlements, merchant_settlements, pix_merchant_settlement_orders
- **ATENÇÃO:** Usa TRUNCATE TABLE antes de sincronizar

**g) sync-payout** - Pagamentos
- Endpoint: `GET /v1/payouts/statement`

**h) sync-payoutAntecipations** - Antecipações
- Endpoint: `GET /v1/payout_anticipations/statement`
- **ATENÇÃO:** Usa TRUNCATE TABLE antes de sincronizar

**i) sync-paymentLink** - Links de Pagamento
- Endpoints: GET/PUT `/v1/external_payment_links`

**Configuração:**
- Feature flag: `DOCK_SYNC_ENABLED=false`
- Headers: `Authorization: Bearer {DOCK_API_KEY}`, `X-Customer: {DOCK_X_CUSTOMER}`

### 5.3. Gestão de Merchants e Preços
CRUD completo com:
- Preços por bandeira e produto
- Contas PIX
- Upload de documentos (S3)
- Associação com CNAEs e consultores

### 5.4. Liquidações e Pagamentos
Gestão do ciclo completo:
- Settlements, payouts, antecipações
- Ordens de pagamento PIX
- Ajustes financeiros
- Relatórios

### 5.5. Gestão de Fornecedores e Taxas
Sistema de cadastro com:
- Upload de documentos
- MDR por CNAE
- Workflow de aprovação de taxas

---

## 6. Integrações Externas

### 6.1. Dock API (Adquirência)

**APIs Utilizadas:**

**Merchants API**
- Base: `DOCK_API_URL_MERCHANTS` (https://merchant.acquiring.dock.tech)
- Endpoints: /v1/merchants, /v1/merchants/{slug}/merchant_prices

**Settlement API**
- Base: `DOCK_API_URL_SETTLEMENT` (https://settlement.acquiring.dock.tech)
- Endpoints: /v1/settlements, /v1/payouts/statement, /v1/payout_anticipations/statement

**Service Order API**
- Base: `DOCK_API_URL_SERVICEORDER` (https://serviceorder.acquiring.dock.tech)
- Endpoints: /v1/external_payment_links

**Terminals API**
- Base: `DOCK_API_URL_TERMINALS`
- Endpoints: /v1/terminals

**Transactions API**
- Base: `DOCK_API_URL_TRANSACTIONS`
- Endpoints: /v1/financial_transactions

**Autenticação:**
- Header: `Authorization: Bearer {DOCK_API_KEY}`
- Header: `X-Customer: {DOCK_X_CUSTOMER}`

### 6.2. AWS S3
- SDK: @aws-sdk/client-s3 v3.828.0
- Operações: Upload de documentos, arquivos, relatórios
- Bucket: file-upload-outbank.s3.amazonaws.com

### 6.3. Clerk (Autenticação)
- SDK: @clerk/nextjs v6.19.0
- Funcionalidades: Sign In/Up, sessões, proteção de rotas
- ClerkId armazenado em users.clerkId

### 6.4. Resend (Emails)
- SDK: resend v4.6.0
- Uso: Emails de boas-vindas, notificações, alertas
- **ATENÇÃO:** RESEND_API_KEY obrigatória para build

### 6.5. Neon/Vercel Postgres
- SDKs: @neondatabase/serverless, @vercel/postgres
- Suporta múltiplas env vars: DATABASE_URL, POSTGRES_URL, NEON_DATABASE_URL

---

## 7. Componentes de UI/UX Específicos

### Componentes Base (shadcn/ui)
- button, input, table, dialog, dropdown-menu, select, tabs
- toast (sonner), badge, checkbox, switch, tooltip, avatar

### Componentes Complexos
- **CustomersList** - Tabela de ISOs com badges e ações
- **CustomerActionButtons** - Ativar/Desativar/Deletar ISO
- **FileUpload** - Upload para S3 com drag & drop
- **FornecedorForm** - Formulário com máscara CNPJ
- **Dashboard Charts** - Gráficos com recharts

### Features Específicas
- Máscaras de input (CPF, CNPJ, valores)
- Notificações (sonner)
- Dark mode (next-themes)
- Idle timer (logout automático)
- Animações (tailwindcss-animated)

---

## 8. Desafios e Pontos de Preocupação na Migração

### 8.1. Multi-tenancy e Isolamento
**Problema:** Sem Row-Level Security (RLS) no PostgreSQL. Isolamento apenas na aplicação.

**Recomendações:**
- Implementar RLS no PostgreSQL
- Criar policies por tenant
- Audit log de acesso cross-tenant

### 8.2. Jobs de Sincronização Dock
**Problemas:**
- Timeouts em serverless (10-60s)
- TRUNCATE destrutivo
- Sem retry logic ou queues
- Sem rate limiting

**Recomendações:**
- Sistema de filas (BullMQ, AWS SQS)
- Workers/cron dedicados
- Incremental sync (evitar TRUNCATE)
- Retry logic com exponential backoff
- Monitoramento e alertas

### 8.3. Variáveis de Ambiente
**Problemas:**
- Naming inconsistente (DATABASE_URL vs POSTGRES_URL vs NEON_DATABASE_URL)
- RESEND_API_KEY obrigatória em build-time
- Sem validação de env vars

**Recomendações:**
- Padronizar naming
- Usar @t3-oss/env-nextjs para validação
- Secrets management (AWS Secrets Manager, Vault)
- Health check de env vars

### 8.4. Hard Delete de ISOs
**Problemas:**
- Perda permanente de dados
- Sem backup antes de deletar
- Sem audit trail

**Recomendações:**
- Soft delete (deletedAt)
- Backup automático
- Audit log de deleções
- Retention policy

### 8.5. Arquivos e Storage
**Problemas:**
- Sem signed URLs
- Sem CDN
- Sem otimização de imagens
- Sem validação de vírus

**Recomendações:**
- Signed URLs para upload
- CDN (CloudFront)
- Otimização de imagens
- Antivírus scan
- Cleanup de arquivos órfãos

### 8.6. Monitoramento
**Missing:**
- APM, logging estruturado, error tracking, metrics, alertas

**Recomendações:**
- Sentry para error tracking
- Logging estruturado (JSON)
- APM (New Relic, Datadog)
- Alertas críticos

### 8.7. Testes
**Missing:**
- Unit tests, integration tests, E2E tests, load tests

**Recomendações:**
- Jest + React Testing Library
- Testes de integração para APIs
- E2E tests (Playwright/Cypress)
- CI/CD com testes obrigatórios

### 8.8. Performance
**Problemas:**
- Queries N+1, sem caching, sem pagination em algumas listagens

**Recomendações:**
- Caching (Redis)
- Otimizar queries
- Pagination em todas as listagens
- Connection pooling
- Read replicas

---

## 9. Mapeamento para Base44

**IMPORTANTE:** Confirmar capacidades da plataforma Base44.

| Componente | Atual | Base44 | Ações |
|------------|-------|--------|-------|
| Banco | PostgreSQL (Neon/Vercel) | PostgreSQL Base44 | Migrar schema via Drizzle |
| Storage | AWS S3 | Storage Base44 ou S3 | Confirmar compatibilidade |
| Auth | Clerk | Auth Base44 ou Clerk | Confirmar suporte |
| Jobs | Sem cron | Cron Base44 | Implementar schedules |
| Queues | Sem queues | Queue Base44 | Migrar syncs |
| Email | Resend | Email Base44 ou manter | Confirmar suporte |
| Monitoring | Sem APM | APM Base44 | Implementar |

---

## 10. Checklist de Migração

### Fase 1: Preparação
- [ ] Confirmar capacidades Base44
- [ ] Mapear serviços
- [ ] Criar ambiente staging
- [ ] Configurar secrets
- [ ] Implementar RLS
- [ ] Adicionar testes

### Fase 2: Migração de Dados
- [ ] Backup completo
- [ ] Executar migrations
- [ ] Migrar dados
- [ ] Validar integridade
- [ ] Migrar arquivos S3

### Fase 3: Migração de Código
- [ ] Adaptar env vars
- [ ] Adaptar storage
- [ ] Implementar queues
- [ ] Migrar syncs para workers
- [ ] Implementar cron jobs
- [ ] Configurar logging
- [ ] Implementar monitoramento

### Fase 4: Testes
- [ ] Testes de integração
- [ ] Testes de syncs Dock
- [ ] Testes de upload
- [ ] Testes de auth
- [ ] Testes de multi-tenancy
- [ ] Load tests

### Fase 5: Deploy
- [ ] Deploy em produção
- [ ] Configurar DNS
- [ ] Configurar SSL/TLS
- [ ] Smoke tests
- [ ] Monitorar logs

### Fase 6: Pós-migração
- [ ] Monitorar por 48h
- [ ] Validar syncs
- [ ] Validar uploads
- [ ] Documentar lições

---

## 11. Informações Adicionais Necessárias

**Plataforma Base44:**
- Versão PostgreSQL suportada
- Sistema de cron/jobs
- Sistema de queues
- Storage (S3-compatible?)
- Suporte a Clerk
- Limites de timeout, memória, CPU
- Custom domains por tenant

**Integrações:**
- Dock API: whitelist de IPs?
- AWS S3: manter ou migrar?
- Resend: manter ou alternativa?

**Performance:**
- Volume de transações esperado
- Volume de syncs Dock
- SLA esperado
- Backup e disaster recovery

**Segurança:**
- Compliance (PCI-DSS, LGPD)
- Audit log
- Encryption at rest/in transit

---

## Resumo Executivo

O Portal Outbank é uma aplicação Next.js 15 multi-tenant complexa para gestão de adquirência de pagamentos com:

- **72 tabelas** no PostgreSQL
- **8 módulos** de sincronização com Dock API
- **Arquitetura multi-tenant** via customers table
- **Integrações:** Dock, AWS S3, Clerk, Resend, Neon/Vercel Postgres

**Principais Desafios para Base44:**
1. Migrar syncs Dock para workers/queues (evitar timeouts serverless)
2. Implementar RLS para isolamento de dados
3. Configurar monitoramento e logging estruturado
4. Adaptar storage (S3 ou alternativa Base44)
5. Implementar testes automatizados
6. Configurar cron jobs para syncs

**Próximos Passos:**
1. Confirmar capacidades da plataforma Base44
2. Criar ambiente de staging
3. Implementar testes críticos
4. Executar migração faseada

---

**Repositório:** https://github.com/ctoutbank/portal-outbank  
**Deploy Atual:** https://portal-outbank.vercel.app/  
**Sessão Devin:** https://app.devin.ai/sessions/2e41e5d5417d41f5b94785331ea6b434  
**Solicitado por:** cto@outbank.com.br (@ctoutbank)

**Documento gerado em:** 13 de Novembro de 2025  
**Versão:** 1.0  
**Status:** Completo - Aguardando confirmação de capacidades Base44
