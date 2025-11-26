# Variáveis de Ambiente - Portal OutBank

Este documento descreve todas as variáveis de ambiente necessárias para o projeto.

## 📋 Índice

- [Clerk Authentication](#clerk-authentication)
- [Banco de Dados](#banco-de-dados)
- [AWS S3](#aws-s3)
- [Resend (Emails)](#resend-emails)
- [Outras Configurações](#outras-configurações)

---

## 🔐 Clerk Authentication

### Variáveis Obrigatórias

#### `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Tipo**: Pública (visível no cliente)
- **Obrigatória**: ✅ Sim
- **Descrição**: Chave pública do Clerk para autenticação
- **Formato**: `pk_live_...` (produção) ou `pk_test_...` (desenvolvimento)
- **Onde obter**: [Dashboard do Clerk](https://dashboard.clerk.com) → API Keys
- **⚠️ IMPORTANTE**: Use chaves de **PRODUÇÃO** (`pk_live_`) em produção, não de desenvolvimento

#### `CLERK_SECRET_KEY`
- **Tipo**: Secreta (apenas servidor)
- **Obrigatória**: ✅ Sim
- **Descrição**: Chave secreta do Clerk para operações no servidor
- **Formato**: `sk_live_...` (produção) ou `sk_test_...` (desenvolvimento)
- **Onde obter**: [Dashboard do Clerk](https://dashboard.clerk.com) → API Keys
- **⚠️ IMPORTANTE**: Use chaves de **PRODUÇÃO** (`sk_live_`) em produção, não de desenvolvimento

### Variáveis para Satellite Domains (Recomendadas)

O sistema usa subdomínios (`*.consolle.one`), então essas variáveis são **recomendadas**:

#### `CLERK_DOMAIN`
- **Tipo**: Secreta
- **Obrigatória**: ⚠️ Recomendada (se usar Satellite Domains)
- **Descrição**: Domínio principal do Clerk
- **Exemplo**: `clerk.consolle.one` ou `accounts.consolle.one`
- **Quando usar**: Se você estiver usando Satellite Domains do Clerk

#### `CLERK_IS_SATELLITE`
- **Tipo**: Secreta
- **Obrigatória**: ⚠️ Recomendada (se usar Satellite Domains)
- **Descrição**: Define se a aplicação é um Satellite Domain
- **Valores**: `true` ou `false`
- **Quando usar**: Se você estiver usando Satellite Domains do Clerk

#### `CLERK_SATELLITE_URL` (Opcional)
- **Tipo**: Secreta
- **Obrigatória**: ❌ Não
- **Descrição**: URL do domínio principal do Clerk (se diferente do padrão)
- **Quando usar**: Configuração avançada de Satellite Domains

### Variáveis Opcionais

#### `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- **Tipo**: Pública
- **Obrigatória**: ❌ Não (tem fallback)
- **Descrição**: URL customizada para sign-in
- **Valor padrão**: `/auth/sign-in`
- **Uso no código**: `src/app/layout.tsx`

#### `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- **Tipo**: Pública
- **Obrigatória**: ❌ Não (tem fallback)
- **Descrição**: URL customizada para sign-up
- **Valor padrão**: `/auth/sign-up`
- **Uso no código**: `src/app/layout.tsx`

---

## 🗄️ Banco de Dados

#### `POSTGRES_URL`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim
- **Descrição**: URL de conexão com o banco de dados PostgreSQL
- **Formato**: `postgresql://user:password@host:port/database`

#### `DATABASE_URL`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (alternativa ao POSTGRES_URL)
- **Descrição**: URL de conexão com o banco de dados (alias para POSTGRES_URL)
- **Formato**: `postgresql://user:password@host:port/database`

---

## ☁️ AWS S3

#### `AWS_ACCESS_KEY_ID`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (se usar upload de arquivos)
- **Descrição**: Chave de acesso da AWS para S3

#### `AWS_SECRET_ACCESS_KEY`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (se usar upload de arquivos)
- **Descrição**: Chave secreta da AWS para S3

#### `AWS_REGION`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (se usar upload de arquivos)
- **Descrição**: Região da AWS (ex: `us-east-1`)

#### `AWS_BUCKET_NAME`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (se usar upload de arquivos)
- **Descrição**: Nome do bucket S3

---

## 📧 Resend (Emails)

#### `RESEND_API_KEY`
- **Tipo**: Secreta
- **Obrigatória**: ✅ Sim (se usar envio de emails)
- **Descrição**: Chave da API do Resend para envio de emails
- **Formato**: `re_...`

#### `EMAIL_FROM`
- **Tipo**: Pública
- **Obrigatória**: ❌ Não (tem fallback)
- **Descrição**: Email remetente padrão
- **Valor padrão**: `noreply@consolle.one`

---

## ⚙️ Outras Configurações

#### `NODE_ENV`
- **Tipo**: Pública
- **Obrigatória**: ❌ Não
- **Descrição**: Ambiente de execução
- **Valores**: `development`, `production`, `test`

#### `NEXT_PUBLIC_APP_URL`
- **Tipo**: Pública
- **Obrigatória**: ❌ Não
- **Descrição**: URL base da aplicação
- **Exemplo**: `https://portal-outbank.vercel.app`

---

## ✅ Checklist de Configuração no Vercel

### Variáveis Obrigatórias
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (chave de **produção**)
- [ ] `CLERK_SECRET_KEY` (chave de **produção**)
- [ ] `POSTGRES_URL` ou `DATABASE_URL`

### Variáveis Recomendadas (Satellite Domains)
- [ ] `CLERK_DOMAIN` (se usar Satellite Domains)
- [ ] `CLERK_IS_SATELLITE=true` (se usar Satellite Domains)

### Variáveis Opcionais
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (opcional)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (opcional)
- [ ] `AWS_ACCESS_KEY_ID` (se usar S3)
- [ ] `AWS_SECRET_ACCESS_KEY` (se usar S3)
- [ ] `AWS_REGION` (se usar S3)
- [ ] `AWS_BUCKET_NAME` (se usar S3)
- [ ] `RESEND_API_KEY` (se usar emails)
- [ ] `EMAIL_FROM` (opcional)

---

## 🔍 Validação

O sistema valida automaticamente as variáveis de ambiente do Clerk durante o desenvolvimento. Para forçar validação em produção, defina:

```bash
CLERK_VALIDATE_ENV=true
```

Os logs de validação aparecerão no console do servidor.

---

## 📚 Referências

- [Documentação do Clerk](https://clerk.com/docs)
- [Clerk Satellite Domains](https://clerk.com/docs/deployments/satellite-domains)
- [Dashboard do Clerk](https://dashboard.clerk.com)

---

## ⚠️ Avisos Importantes

1. **Nunca commite arquivos `.env`** - Eles contêm informações sensíveis
2. **Use chaves de PRODUÇÃO em produção** - Chaves de desenvolvimento têm limites de uso
3. **Configure Satellite Domains corretamente** - Se usar subdomínios, configure `CLERK_DOMAIN` e `CLERK_IS_SATELLITE`
4. **Valide as variáveis antes de fazer deploy** - Use a validação automática do sistema

