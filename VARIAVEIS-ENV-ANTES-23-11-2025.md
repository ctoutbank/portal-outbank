# 📋 Variáveis de Ambiente - Antes de 23/11/2025

## ⚠️ Limitação
Arquivos `.env` e `.env.local` não são commitados no Git (estão no `.gitignore`), então não é possível ver o conteúdo histórico diretamente.

Porém, baseado na análise do código e documentação, estas são as variáveis que **provavelmente** estavam configuradas antes de 23/11/2025:

---

## ✅ Variáveis Obrigatórias (Baseado no Código)

### 1. Clerk (Autenticação)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
**Status atual:** ✅ Configurado no `.env.local`

### 2. Banco de Dados
```env
DATABASE_URL=postgresql://...
# ou
POSTGRES_URL=postgresql://...
# ou
NEON_DATABASE_URL=postgresql://...
```
**Onde é usado:**
- `src/db/drizzle.ts` - Aceita qualquer uma das 3 variáveis
- `src/app/server/db.ts` - Usa `POSTGRES_URL`
- `drizzle.config.ts` - Lê de `.env.local`

**Status atual:** ❌ Não configurado

### 3. Resend (Email)
```env
RESEND_API_KEY=re_...
```
**Onde é usado:**
- `src/lib/resend.ts` - Obrigatório (lança erro se não configurado)
- `src/utils/send-email.ts`
- `src/utils/send-email-adtivo.ts`

**Status atual:** ❌ Não configurado

### 4. AWS S3 (Storage)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=file-upload-outbank
```
**Onde é usado:**
- `src/lib/s3-client/s3Client.ts`
- `src/features/pricingSolicitation/server/integrations/s3client.ts`
- `src/utils/serverActions.ts` - Upload de imagens de customização

**Valores padrão encontrados:**
- `AWS_REGION` - Padrão: `us-east-1` (se não configurado)
- `AWS_BUCKET_NAME` - Documentado como `file-upload-outbank` em `PROBLEMA-IMAGENS-CACHE.md`

**Status atual:** ❌ Não configurado

---

## 🔧 Variáveis Opcionais (Integração Dock)

### 5. Dock API
```env
DOCK_API_KEY=...
DOCK_API_URL_MERCHANTS=https://merchant.acquiring.dock.tech
DOCK_API_URL_SETTLEMENT=https://settlement.acquiring.dock.tech
DOCK_API_URL_TRANSACTIONS=https://transactions.acquiring.dock.tech
DOCK_SYNC_ENABLED=false
DOCK_WRITE_ENABLED=true
```
**Onde é usado:**
- Vários arquivos de sincronização Dock
- `src/features/pricingSolicitation/server/integrations/dock/`

**Status atual:** ❌ Não configurado

---

## 📧 Variáveis de Email (Opcionais)

### 6. Email FROM
```env
EMAIL_FROM=noreply@consolle.one
```
**Onde é usado:**
- `src/utils/send-email.ts` - Padrão: `noreply@consolle.one`
- `src/lib/send-email.ts` - Padrão: `noreply@consolle.one`
- `src/utils/send-email-adtivo.ts` - Padrão: `noreply@consolle.one`

**Status atual:** ⚠️ Usa valor padrão

---

## 🔄 Variáveis de Revalidação (Opcionais)

### 7. Outbank One
```env
NEXT_PUBLIC_OUTBANK_ONE_URL=https://outbank-one.vercel.app
REVALIDATE_TOKEN=...
```
**Onde é usado:**
- `src/utils/serverActions.ts` - Revalidação de cache

**Status atual:** ⚠️ Usa valor padrão

---

## 📝 Template Completo Estimado (Antes de 23/11/2025)

```env
# ============================================
# CLERK (Autenticação) - OBRIGATÓRIO
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ============================================
# BANCO DE DADOS - OBRIGATÓRIO
# ============================================
DATABASE_URL=postgresql://usuario:senha@host/database
# ou
POSTGRES_URL=postgresql://usuario:senha@host/database

# ============================================
# RESEND (Email) - OBRIGATÓRIO
# ============================================
RESEND_API_KEY=re_...

# ============================================
# AWS S3 (Storage) - OBRIGATÓRIO
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=file-upload-outbank

# ============================================
# DOCK API (Opcional - se usar integração)
# ============================================
DOCK_API_KEY=...
DOCK_API_URL_MERCHANTS=https://merchant.acquiring.dock.tech
DOCK_API_URL_SETTLEMENT=https://settlement.acquiring.dock.tech
DOCK_API_URL_TRANSACTIONS=https://transactions.acquiring.dock.tech
DOCK_SYNC_ENABLED=false
DOCK_WRITE_ENABLED=true

# ============================================
# EMAIL (Opcional - tem valor padrão)
# ============================================
EMAIL_FROM=noreply@consolle.one

# ============================================
# OUTBANK ONE (Opcional - tem valor padrão)
# ============================================
NEXT_PUBLIC_OUTBANK_ONE_URL=https://outbank-one.vercel.app
REVALIDATE_TOKEN=...
```

---

## 🔍 Como Obter os Valores Reais

Como os arquivos `.env` não estão no Git, você pode obter os valores reais de:

1. **Vercel Dashboard:**
   - Settings > Environment Variables
   - Lá devem estar todas as variáveis configuradas para produção

2. **Backup local:**
   - Se você tinha um backup do `.env.local` antes de deletar o repositório

3. **Outros desenvolvedores:**
   - Se outros membros da equipe têm o arquivo configurado

4. **Serviços externos:**
   - **Neon/Vercel Postgres:** Dashboard do serviço de banco de dados
   - **Resend:** Dashboard do Resend
   - **AWS:** Console da AWS (IAM > Access Keys)
   - **Clerk:** Dashboard do Clerk (já temos essas)

---

## ✅ Próximos Passos

1. **Acessar Vercel Dashboard** e copiar todas as variáveis de ambiente
2. **Verificar serviços externos** para obter credenciais
3. **Adicionar ao `.env.local`** localmente
4. **Testar** se o projeto funciona com essas variáveis

---

**Nota:** Este documento é uma estimativa baseada na análise do código. Os valores reais devem ser obtidos do Vercel ou de backups.

