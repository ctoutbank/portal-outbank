# 🚀 Instruções: Configurar Variáveis Dock API no Vercel

Este documento fornece instruções passo a passo para configurar as variáveis de ambiente da API Dock no Vercel Dashboard do portal-outbank.

---

## 📋 Pré-requisitos

1. Acesso ao **Vercel Dashboard** do projeto `outbank-one`
2. Acesso ao **Vercel Dashboard** do projeto `portal-outbank`
3. Lista de variáveis `DOCK_*` do outbank-one

---

## 🔍 Passo 1: Obter Variáveis do Outbank-One

1. Acessar **Vercel Dashboard**: https://vercel.com
2. Selecionar o projeto **outbank-one**
3. Ir em **Settings** > **Environment Variables**
4. Filtrar por `DOCK_` para ver apenas variáveis Dock
5. **Copiar os valores** das seguintes variáveis:
   - `DOCK_API_KEY`
   - `DOCK_API_URL_MERCHANTS`
   - `DOCK_API_URL_SETTLEMENT`
   - `DOCK_API_URL_TRANSACTIONS`
   - `DOCK_API_URL_TERMINALS`
   - `DOCK_API_URL_SERVICEORDER`
   - `DOCK_API_URL_PLATAFORMA_DADOS` (se existir)
   - `DOCK_X_CUSTOMER` (se existir)

---

## ⚙️ Passo 2: Configurar Portal-Outbank no Vercel

1. Acessar **Vercel Dashboard**: https://vercel.com
2. Selecionar o projeto **portal-outbank**
3. Ir em **Settings** > **Environment Variables**

### 2.1. Adicionar Variáveis Obrigatórias (Mesmas do Outbank-One)

Para cada variável abaixo, clicar em **Add New** e adicionar:

#### DOCK_API_KEY
- **Name:** `DOCK_API_KEY`
- **Value:** [Valor copiado do outbank-one]
- **Environment:** `Production`, `Preview`, `Development` (marcar todos)
- **Description:** Chave de autenticação Bearer Token para API Dock

#### DOCK_API_URL_MERCHANTS
- **Name:** `DOCK_API_URL_MERCHANTS`
- **Value:** `https://merchant.acquiring.dock.tech` (ou valor do outbank-one)
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL base da API de merchants da Dock

#### DOCK_API_URL_SETTLEMENT
- **Name:** `DOCK_API_URL_SETTLEMENT`
- **Value:** `https://settlement.acquiring.dock.tech` (ou valor do outbank-one)
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL base da API de settlements da Dock

#### DOCK_API_URL_TRANSACTIONS
- **Name:** `DOCK_API_URL_TRANSACTIONS`
- **Value:** `https://transaction.acquiring.dock.tech` (ou valor do outbank-one)
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL base da API de transações da Dock

#### DOCK_API_URL_TERMINALS
- **Name:** `DOCK_API_URL_TERMINALS`
- **Value:** `https://terminal.acquiring.dock.tech` (ou valor do outbank-one)
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL base da API de terminais da Dock

#### DOCK_API_URL_SERVICEORDER
- **Name:** `DOCK_API_URL_SERVICEORDER`
- **Value:** `https://serviceorder.acquiring.dock.tech` (ou valor do outbank-one)
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL base da API de service orders da Dock

#### DOCK_API_URL_PLATAFORMA_DADOS (Opcional)
- **Name:** `DOCK_API_URL_PLATAFORMA_DADOS`
- **Value:** [Valor do outbank-one, se existir]
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** URL alternativa para plataforma de dados

#### DOCK_X_CUSTOMER (Opcional)
- **Name:** `DOCK_X_CUSTOMER`
- **Value:** [Valor do outbank-one, se existir]
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** Header X-Customer para alguns endpoints

### 2.2. Adicionar Variáveis de Controle (Específicas do Portal-Outbank)

#### DOCK_SYNC_ENABLED
- **Name:** `DOCK_SYNC_ENABLED`
- **Value:** `false`
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** Desabilita sincronização automática (portal-outbank não faz sync)

#### DOCK_WRITE_ENABLED
- **Name:** `DOCK_WRITE_ENABLED`
- **Value:** `true`
- **Environment:** `Production`, `Preview`, `Development`
- **Description:** Habilita escrita manual na API Dock

---

## ✅ Passo 3: Verificar Configuração

Após adicionar todas as variáveis:

1. **Verificar lista completa:**
   - Deve haver pelo menos 8 variáveis `DOCK_*`
   - Todas devem estar marcadas para `Production`, `Preview` e `Development`

2. **Comparar com outbank-one:**
   - Verificar se `DOCK_API_KEY` é idêntica
   - Verificar se todas as URLs são idênticas
   - Apenas `DOCK_SYNC_ENABLED` deve ser diferente (`false` no portal-outbank)

---

## 🚀 Passo 4: Fazer Deploy

1. **Opção 1: Deploy Automático**
   - Fazer commit e push para triggerar deploy automático
   - As novas variáveis estarão disponíveis no próximo deploy

2. **Opção 2: Redeploy Manual**
   - Ir em **Deployments**
   - Clicar nos três pontos do último deployment
   - Selecionar **Redeploy**
   - As novas variáveis serão aplicadas

---

## 🧪 Passo 5: Testar

Após o deploy:

1. **Verificar logs:**
   - Ir em **Deployments** > [Último deploy] > **Build Logs**
   - Verificar se não há erros relacionados a variáveis não encontradas

2. **Testar funcionalidade:**
   - Acessar portal-outbank
   - Tentar criar/editar um merchant
   - Verificar se a API Dock responde corretamente

3. **Verificar erros:**
   - Se houver erro de autenticação, verificar `DOCK_API_KEY`
   - Se houver erro de URL, verificar URLs configuradas

---

## 📋 Checklist Final

- [ ] Variáveis obtidas do outbank-one
- [ ] `DOCK_API_KEY` adicionada (mesma do outbank-one)
- [ ] `DOCK_API_URL_MERCHANTS` adicionada
- [ ] `DOCK_API_URL_SETTLEMENT` adicionada
- [ ] `DOCK_API_URL_TRANSACTIONS` adicionada
- [ ] `DOCK_API_URL_TERMINALS` adicionada
- [ ] `DOCK_API_URL_SERVICEORDER` adicionada
- [ ] `DOCK_SYNC_ENABLED=false` adicionada
- [ ] `DOCK_WRITE_ENABLED=true` adicionada
- [ ] Todas as variáveis marcadas para Production, Preview e Development
- [ ] Deploy realizado
- [ ] Testes realizados com sucesso

---

## ⚠️ Observações Importantes

1. **Valores Idênticos:**
   - As variáveis obrigatórias devem ser **exatamente iguais** ao outbank-one
   - Apenas `DOCK_SYNC_ENABLED` pode ser diferente

2. **Ambientes:**
   - Sempre marcar todas as variáveis para `Production`, `Preview` e `Development`
   - Isso garante que funcionem em todos os ambientes

3. **Segurança:**
   - `DOCK_API_KEY` é sensível - não compartilhar publicamente
   - Não commitar no Git (já está no `.gitignore`)

4. **Atualizações:**
   - Se o outbank-one atualizar alguma variável, atualizar também no portal-outbank
   - Manter sempre sincronizado

---

## 🔗 Referências

- **Documentação Completa:** `CONFIGURACAO-DOCK-API-COMPARTILHADA.md`
- **Template .env.local:** `TEMPLATE-ENV-DOCK-API.md`
- **Plano de Implementação:** `PLANO-IMPLEMENTAR-ESCRITA-API-DOCK-PORTAL-OUTBANK.md`

---

**Última atualização:** 01 de Dezembro de 2025

