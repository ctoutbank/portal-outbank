# 📘 Guia Completo de Configuração - Portal OutBank

**Data de Referência:** 23/11/2025 (Commit: d6d39df)  
**Objetivo:** Configurar Vercel, Neon e Clerk exatamente como estava na data de referência

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Neon (Banco de Dados)](#1-configuração-do-neon-banco-de-dados)
3. [Configuração do Clerk (Autenticação)](#2-configuração-do-clerk-autenticação)
4. [Configuração do Vercel (Deploy)](#3-configuração-do-vercel-deploy)
5. [Verificação Final](#verificação-final)
6. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Neon](https://neon.tech)
- Conta no [Clerk](https://clerk.com)
- Acesso ao repositório GitHub: `ctoutbank/portal-outbank`
- Domínio configurado (se usar Satellite Domains): `*.consolle.one`

---

## 1. Configuração do Neon (Banco de Dados)

### 1.1. Criar Projeto no Neon

1. Acesse [https://console.neon.tech](https://console.neon.tech)
2. Faça login ou crie uma conta
3. Clique em **"Create a project"**
4. Preencha:
   - **Project name**: `portal-outbank` (ou nome de sua preferência)
   - **Region**: Escolha a região mais próxima (ex: `us-east-1`)
   - **PostgreSQL version**: `15` ou superior
5. Clique em **"Create project"**

### 1.2. Obter String de Conexão

1. No dashboard do Neon, vá em **"Connection Details"**
2. Você verá a string de conexão no formato:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
3. **Copie essa string completa** - você precisará dela no Vercel

### 1.3. Executar Migrações (Opcional - se necessário)

Se você precisar executar migrações manualmente:

```bash
# Instalar dependências
yarn install

# Executar migrações
yarn drizzle-kit push
```

**Nota:** As migrações também podem ser executadas automaticamente pelo Vercel durante o deploy.

---

## 2. Configuração do Clerk (Autenticação)

### 2.1. Criar Aplicação no Clerk

1. Acesse [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Faça login ou crie uma conta
3. Clique em **"Create Application"**
4. Preencha:
   - **Application name**: `Portal OutBank` (ou nome de sua preferência)
   - **Authentication providers**: Selecione os que deseja usar (Email, Google, etc.)
5. Clique em **"Create application"**

### 2.2. Obter Chaves de Produção

1. No dashboard do Clerk, vá em **"API Keys"** (menu lateral)
2. Você verá duas seções:
   - **Publishable key** (começa com `pk_live_...`)
   - **Secret key** (começa com `sk_live_...`)

3. **⚠️ IMPORTANTE:** Certifique-se de estar na aba **"Production"**, não **"Development"**
   - Chaves de produção começam com `pk_live_` e `sk_live_`
   - Chaves de desenvolvimento começam com `pk_test_` e `sk_test_`

4. **Copie ambas as chaves** - você precisará delas no Vercel

### 2.3. Configurar Satellite Domains (Opcional - se usar subdomínios)

Se você estiver usando subdomínios como `*.consolle.one`:

1. No dashboard do Clerk, vá em **"Domains"** (menu lateral)
2. Clique em **"Add domain"**
3. Configure:
   - **Domain type**: `Satellite`
   - **Domain**: `consolle.one` (seu domínio principal)
   - **Frontend API**: Deixe o padrão ou configure conforme necessário
4. Clique em **"Add domain"**

5. Após adicionar, você verá:
   - **CLERK_DOMAIN**: O domínio principal do Clerk (ex: `clerk.consolle.one`)
   - **CLERK_IS_SATELLITE**: `true`

6. **Anote o valor de CLERK_DOMAIN** - você precisará dele no Vercel

### 2.4. Configurar URLs de Sign-In/Sign-Up (Opcional)

1. No dashboard do Clerk, vá em **"Paths"** (menu lateral)
2. Configure as URLs:
   - **Sign-in path**: `/auth/sign-in` (ou deixe o padrão)
   - **Sign-up path**: `/auth/sign-up` (ou deixe o padrão)
3. Salve as alterações

---

## 3. Configuração do Vercel (Deploy)

### 3.1. Conectar Repositório

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login ou crie uma conta
3. Clique em **"Add New..."** → **"Project"**
4. Conecte o repositório GitHub: `ctoutbank/portal-outbank`
5. Selecione o repositório e clique em **"Import"**

### 3.2. Configurar Build Settings

1. Na página de configuração do projeto, verifique:
   - **Framework Preset**: `Next.js` (deve ser detectado automaticamente)
   - **Root Directory**: `.` (raiz do projeto)
   - **Build Command**: `yarn build` (ou deixe o padrão)
   - **Output Directory**: `.next` (ou deixe o padrão)
   - **Install Command**: `yarn install` (ou deixe o padrão)

2. Clique em **"Environment Variables"** (ou vá direto para a próxima seção)

### 3.3. Configurar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione as seguintes variáveis:

#### 🔐 Variáveis Obrigatórias do Clerk

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - **Value**: Cole a chave pública do Clerk (começa com `pk_live_...`)
   - **Environment**: Selecione todas (`Production`, `Preview`, `Development`)
   - Clique em **"Save"**

2. **CLERK_SECRET_KEY**
   - **Value**: Cole a chave secreta do Clerk (começa com `sk_live_...`)
   - **Environment**: Selecione todas (`Production`, `Preview`, `Development`)
   - Clique em **"Save"**

#### 🌐 Variáveis de Satellite Domains (se usar subdomínios)

3. **CLERK_DOMAIN**
   - **Value**: O domínio principal do Clerk (ex: `clerk.consolle.one`)
   - **Environment**: Selecione todas
   - Clique em **"Save"**

4. **CLERK_IS_SATELLITE**
   - **Value**: `true` (se usar Satellite Domains) ou `false` (se não usar)
   - **Environment**: Selecione todas
   - Clique em **"Save"**

#### 🔗 Variáveis Opcionais do Clerk

5. **NEXT_PUBLIC_CLERK_SIGN_IN_URL** (Opcional)
   - **Value**: `/auth/sign-in` (ou deixe vazio para usar o padrão)
   - **Environment**: Selecione todas
   - Clique em **"Save"**

6. **NEXT_PUBLIC_CLERK_SIGN_UP_URL** (Opcional)
   - **Value**: `/auth/sign-up` (ou deixe vazio para usar o padrão)
   - **Environment**: Selecione todas
   - Clique em **"Save"**

#### 🗄️ Variáveis do Banco de Dados (Neon)

7. **POSTGRES_URL** ou **DATABASE_URL**
   - **Value**: Cole a string de conexão completa do Neon
     ```
     postgresql://user:password@host.neon.tech/dbname?sslmode=require
     ```
   - **Environment**: Selecione todas
   - Clique em **"Save"**
   - **Nota:** O código aceita `POSTGRES_URL`, `DATABASE_URL` ou `NEON_DATABASE_URL`

#### ☁️ Variáveis do AWS S3 (se usar upload de arquivos)

8. **AWS_ACCESS_KEY_ID**
   - **Value**: Sua chave de acesso da AWS
   - **Environment**: Selecione todas
   - Clique em **"Save"**

9. **AWS_SECRET_ACCESS_KEY**
   - **Value**: Sua chave secreta da AWS
   - **Environment**: Selecione todas
   - Clique em **"Save"**

10. **AWS_REGION**
    - **Value**: Região da AWS (ex: `us-east-1`)
    - **Environment**: Selecione todas
    - Clique em **"Save"**

11. **AWS_BUCKET_NAME**
    - **Value**: Nome do bucket S3 (ex: `file-upload-outbank`)
    - **Environment**: Selecione todas
    - Clique em **"Save"**

#### 📧 Variáveis do Resend (se usar envio de emails)

12. **RESEND_API_KEY**
    - **Value**: Sua chave da API do Resend (começa com `re_...`)
    - **Environment**: Selecione todas
    - Clique em **"Save"**

13. **EMAIL_FROM** (Opcional)
    - **Value**: Email remetente padrão (ex: `noreply@consolle.one`)
    - **Environment**: Selecione todas
    - Clique em **"Save"**

#### ⚙️ Outras Variáveis (Opcionais)

14. **NODE_ENV** (Opcional)
    - **Value**: `production`
    - **Environment**: Apenas `Production`
    - Clique em **"Save"**

15. **NEXT_PUBLIC_APP_URL** (Opcional)
    - **Value**: URL da aplicação (ex: `https://portal-outbank.vercel.app`)
    - **Environment**: Selecione todas
    - Clique em **"Save"**

### 3.4. Fazer Deploy

1. Após configurar todas as variáveis, volte para a página principal do projeto
2. Clique em **"Deploy"** (ou o deploy será iniciado automaticamente)
3. Aguarde o build completar
4. Verifique os logs do build para garantir que não há erros

### 3.5. Configurar Domínio Customizado (Opcional)

Se você quiser usar um domínio customizado:

1. No projeto do Vercel, vá em **"Settings"** → **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `portal-outbank.consolle.one`)
4. Siga as instruções para configurar DNS
5. Aguarde a verificação do domínio

---

## 4. Verificação Final

### 4.1. Verificar Variáveis no Vercel

1. No projeto do Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Verifique se todas as variáveis obrigatórias estão configuradas:
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - ✅ `CLERK_SECRET_KEY`
   - ✅ `POSTGRES_URL` ou `DATABASE_URL`
   - ✅ `CLERK_DOMAIN` (se usar Satellite Domains)
   - ✅ `CLERK_IS_SATELLITE` (se usar Satellite Domains)

### 4.2. Verificar Logs do Deploy

1. No projeto do Vercel, vá em **"Deployments"**
2. Clique no último deploy
3. Verifique os logs do build:
   - Procure por mensagens de erro
   - Verifique se a validação do Clerk passou (se configurada)
   - Confirme que o build foi bem-sucedido

### 4.3. Testar a Aplicação

1. Acesse a URL do deploy (ex: `https://portal-outbank.vercel.app`)
2. Teste o login:
   - Tente fazer sign-in
   - Verifique se a autenticação funciona
   - Teste em diferentes subdomínios (se usar Satellite Domains)
3. Verifique o console do navegador:
   - Não deve haver erros relacionados ao Clerk
   - Não deve aparecer o aviso de "development keys"

### 4.4. Verificar Validação Automática

O sistema valida automaticamente as variáveis do Clerk. Para ver os logs de validação:

1. No Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Adicione (opcional): `CLERK_VALIDATE_ENV=true`
3. Faça um novo deploy
4. Verifique os logs do servidor para ver mensagens de validação

---

## 5. Checklist Completo

Use este checklist para garantir que tudo está configurado:

### Neon (Banco de Dados)
- [ ] Projeto criado no Neon
- [ ] String de conexão copiada
- [ ] Variável `POSTGRES_URL` ou `DATABASE_URL` configurada no Vercel
- [ ] Migrações executadas (se necessário)

### Clerk (Autenticação)
- [ ] Aplicação criada no Clerk
- [ ] Chaves de **PRODUÇÃO** obtidas (`pk_live_...` e `sk_live_...`)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` configurada no Vercel
- [ ] `CLERK_SECRET_KEY` configurada no Vercel
- [ ] Satellite Domains configurado (se usar subdomínios)
- [ ] `CLERK_DOMAIN` configurada no Vercel (se usar Satellite Domains)
- [ ] `CLERK_IS_SATELLITE` configurada no Vercel (se usar Satellite Domains)
- [ ] URLs de sign-in/sign-up configuradas (opcional)

### Vercel (Deploy)
- [ ] Repositório conectado
- [ ] Build settings configuradas
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Domínio customizado configurado (se necessário)

### Testes
- [ ] Aplicação acessível
- [ ] Login funcionando
- [ ] Sem erros no console do navegador
- [ ] Sem avisos de "development keys"
- [ ] Conexão com banco de dados funcionando

---

## 6. Troubleshooting

### Erro: "Clerk has been loaded with development keys"

**Causa:** Você está usando chaves de desenvolvimento em produção.

**Solução:**
1. Acesse o dashboard do Clerk
2. Vá em **"API Keys"**
3. Certifique-se de estar na aba **"Production"**
4. Copie as chaves de produção (`pk_live_...` e `sk_live_...`)
5. Atualize as variáveis no Vercel

### Erro: "DATABASE_URL não está definida"

**Causa:** A variável de ambiente do banco de dados não está configurada.

**Solução:**
1. Verifique se `POSTGRES_URL` ou `DATABASE_URL` está configurada no Vercel
2. Certifique-se de que a string de conexão está completa
3. Verifique se a variável está disponível para o ambiente correto (Production/Preview/Development)

### Erro: "MIDDLEWARE_INVOCATION_FAILED"

**Causa:** Problema com a configuração do Clerk ou variáveis faltando.

**Solução:**
1. Verifique se todas as variáveis do Clerk estão configuradas
2. Certifique-se de que está usando chaves de produção
3. Se usar Satellite Domains, verifique se `CLERK_DOMAIN` e `CLERK_IS_SATELLITE` estão configuradas
4. Verifique os logs do Vercel para mais detalhes

### Erro: "Connection refused" ou "Database connection failed"

**Causa:** Problema com a string de conexão do Neon.

**Solução:**
1. Verifique se a string de conexão está correta
2. Certifique-se de que o projeto Neon está ativo
3. Verifique se o IP está permitido (Neon permite conexões de qualquer IP por padrão)
4. Teste a conexão diretamente usando um cliente PostgreSQL

### Erro: Build falha no Vercel

**Causa:** Variáveis de ambiente faltando ou incorretas.

**Solução:**
1. Verifique os logs do build no Vercel
2. Confirme que todas as variáveis obrigatórias estão configuradas
3. Verifique se não há erros de sintaxe nas variáveis
4. Certifique-se de que as variáveis estão disponíveis para o ambiente correto

---

## 7. Referências Úteis

- **Documentação do Clerk**: https://clerk.com/docs
- **Clerk Satellite Domains**: https://clerk.com/docs/deployments/satellite-domains
- **Dashboard do Clerk**: https://dashboard.clerk.com
- **Neon Console**: https://console.neon.tech
- **Documentação do Neon**: https://neon.tech/docs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentação do Vercel**: https://vercel.com/docs

---

## 8. Suporte

Se você encontrar problemas que não estão listados aqui:

1. Verifique os logs do Vercel
2. Verifique os logs do console do navegador
3. Consulte a documentação do `ENV_VARIABLES.md` no repositório
4. Verifique se a validação automática do Clerk está ativada (`CLERK_VALIDATE_ENV=true`)

---

**Última atualização:** 25/11/2025  
**Versão do guia:** 1.0  
**Commit de referência:** d6d39df (23/11/2025)

