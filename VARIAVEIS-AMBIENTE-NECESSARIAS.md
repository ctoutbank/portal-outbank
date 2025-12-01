# 📋 Variáveis de Ambiente Necessárias

## ✅ Variáveis Configuradas no .env.local

Atualmente o arquivo `.env.local` possui apenas:
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ✅ `CLERK_SECRET_KEY`

---

## ⚠️ Variáveis Faltando (Obrigatórias)

### 1. Banco de Dados
- `DATABASE_URL` ou `POSTGRES_URL` ou `NEON_DATABASE_URL`
  - **Uso:** Conexão com PostgreSQL/Neon
  - **Onde:** `src/db/drizzle.ts`, `src/app/server/db.ts`
  - **Formato:** `postgresql://usuario:senha@host/database`

### 2. Resend (Email)
- `RESEND_API_KEY`
  - **Uso:** Envio de emails
  - **Onde:** `src/lib/resend.ts`
  - **Obrigatório:** Sim (lança erro se não configurado)

### 3. AWS S3 (Storage)
- `AWS_REGION`
  - **Uso:** Região do bucket S3
  - **Onde:** `src/lib/s3-client/s3Client.ts`, `src/utils/serverActions.ts`
  - **Padrão:** `us-east-1` (se não configurado)

- `AWS_ACCESS_KEY_ID`
  - **Uso:** Credencial AWS para S3
  - **Onde:** `src/lib/s3-client/s3Client.ts`
  - **Obrigatório:** Sim (uploads falharão sem isso)

- `AWS_SECRET_ACCESS_KEY`
  - **Uso:** Credencial AWS para S3
  - **Onde:** `src/lib/s3-client/s3Client.ts`
  - **Obrigatório:** Sim (uploads falharão sem isso)

- `AWS_BUCKET_NAME`
  - **Uso:** Nome do bucket S3
  - **Onde:** `src/utils/serverActions.ts`
  - **Obrigatório:** Sim

---

## 🔧 Variáveis Opcionais (mas Recomendadas)

### 4. Dock API (Integração)
- `DOCK_API_KEY`
  - **Uso:** Autenticação na API Dock
  - **Onde:** Vários arquivos de sincronização Dock
  - **Formato:** Token Bearer

- `DOCK_API_URL_MERCHANTS`
  - **Uso:** URL base da API de merchants da Dock
  - **Onde:** Integrações Dock
  - **Exemplo:** `https://merchant.acquiring.dock.tech`

- `DOCK_API_URL_SETTLEMENT`
  - **Uso:** URL base da API de settlements da Dock
  - **Onde:** `src/features/pricingSolicitation/server/integrations/dock/sync-settlements/`
  - **Exemplo:** `https://settlement.acquiring.dock.tech`

- `DOCK_API_URL_TRANSACTIONS`
  - **Uso:** URL base da API de transações da Dock
  - **Onde:** `src/features/pricingSolicitation/server/integrations/dock/sync-transactions/`

- `DOCK_SYNC_ENABLED`
  - **Uso:** Flag para habilitar/desabilitar sincronização Dock
  - **Valores:** `true` ou `false`
  - **Padrão:** `false`

- `DOCK_WRITE_ENABLED`
  - **Uso:** Flag para habilitar escrita na API Dock
  - **Valores:** `true` ou `false`
  - **Padrão:** `true`

### 5. Email
- `EMAIL_FROM`
  - **Uso:** Endereço de email remetente
  - **Onde:** `src/utils/send-email.ts`, `src/lib/send-email.ts`
  - **Padrão:** `noreply@consolle.one`

### 6. Outbank One (Revalidação)
- `NEXT_PUBLIC_OUTBANK_ONE_URL`
  - **Uso:** URL do outbank-one para revalidação de cache
  - **Onde:** `src/utils/serverActions.ts`
  - **Padrão:** `https://outbank-one.vercel.app`

- `REVALIDATE_TOKEN`
  - **Uso:** Token para revalidação de cache no outbank-one
  - **Onde:** `src/utils/serverActions.ts`

### 7. Ambiente
- `NODE_ENV`
  - **Uso:** Ambiente de execução (development, production, test)
  - **Onde:** Vários arquivos
  - **Padrão:** Definido automaticamente pelo Next.js

---

## 📝 Template de .env.local Completo

```env
# ============================================
# CLERK (Autenticação)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ============================================
# BANCO DE DADOS
# ============================================
DATABASE_URL=postgresql://usuario:senha@host/database
# ou
POSTGRES_URL=postgresql://usuario:senha@host/database
# ou
NEON_DATABASE_URL=postgresql://usuario:senha@host/database

# ============================================
# RESEND (Email)
# ============================================
RESEND_API_KEY=re_...

# ============================================
# AWS S3 (Storage)
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=seu-bucket-name

# ============================================
# DOCK API (Opcional)
# ============================================
DOCK_API_KEY=seu-token-dock
DOCK_API_URL_MERCHANTS=https://merchant.acquiring.dock.tech
DOCK_API_URL_SETTLEMENT=https://settlement.acquiring.dock.tech
DOCK_API_URL_TRANSACTIONS=https://transactions.acquiring.dock.tech
DOCK_SYNC_ENABLED=false
DOCK_WRITE_ENABLED=true

# ============================================
# EMAIL (Opcional)
# ============================================
EMAIL_FROM=noreply@consolle.one

# ============================================
# OUTBANK ONE (Opcional)
# ============================================
NEXT_PUBLIC_OUTBANK_ONE_URL=https://outbank-one.vercel.app
REVALIDATE_TOKEN=seu-token-de-revalidacao

# ============================================
# AMBIENTE
# ============================================
NODE_ENV=development
```

---

## 🚨 Variáveis Críticas (Sem elas o app não funciona)

1. **DATABASE_URL** ou **POSTGRES_URL** ou **NEON_DATABASE_URL** - Sem banco, nada funciona
2. **RESEND_API_KEY** - Emails não funcionarão
3. **AWS_ACCESS_KEY_ID** e **AWS_SECRET_ACCESS_KEY** - Uploads falharão
4. **AWS_BUCKET_NAME** - Uploads falharão

---

## ✅ Status Atual

- ✅ Clerk configurado
- ❌ Banco de dados não configurado
- ❌ Resend não configurado
- ❌ AWS S3 não configurado
- ⚠️ Dock API não configurado (opcional)

---

**Próximo passo:** Configure as variáveis obrigatórias para o projeto funcionar corretamente.

