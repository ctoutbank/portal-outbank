# 🔧 Configuração Dock API Compartilhada - Portal-Outbank e Outbank-One

**Data:** 01 de Dezembro de 2025  
**Objetivo:** Configurar portal-outbank com as mesmas variáveis de ambiente da API Dock que o outbank-one utiliza.

---

## 📋 Contexto

- **Não há risco de conflito**: Cada ISO escreve apenas seus próprios merchants (isolamento por customer)
- **Não há escrita simultânea**: Os sistemas não escrevem ao mesmo tempo
- **Portal-outbank é backup**: Usado quando não é possível acessar outbank-one
- **Mesmas variáveis**: Ambos devem usar exatamente as mesmas variáveis de ambiente

---

## 🔑 Variáveis Obrigatórias (API Dock)

Estas variáveis **DEVEM** ser idênticas em ambos os sistemas:

### 1. DOCK_API_KEY
- **Descrição:** Chave de autenticação Bearer Token para a API Dock
- **Formato:** Token JWT completo
- **Onde usar:** Header `Authorization: Bearer ${DOCK_API_KEY}`
- **Obrigatória:** ✅ Sim
- **Exemplo:** `eyJraWQiOiJJTlRFR1JBVElPTiIsInR5cCI6IkpXVCIsImFsZyI6IkhTNTEyIn0...`

### 2. DOCK_API_URL_MERCHANTS
- **Descrição:** URL base da API de merchants da Dock
- **Valor padrão:** `https://merchant.acquiring.dock.tech`
- **Onde usar:** Endpoints de merchants e onboarding
- **Obrigatória:** ✅ Sim

### 3. DOCK_API_URL_SETTLEMENT
- **Descrição:** URL base da API de settlements da Dock
- **Valor padrão:** `https://settlement.acquiring.dock.tech`
- **Onde usar:** Endpoints de settlements, payouts, antecipações
- **Obrigatória:** ✅ Sim

### 4. DOCK_API_URL_TRANSACTIONS
- **Descrição:** URL base da API de transações da Dock
- **Valor padrão:** `https://transaction.acquiring.dock.tech`
- **Onde usar:** Endpoints de transações financeiras
- **Obrigatória:** ✅ Sim

### 5. DOCK_API_URL_TERMINALS
- **Descrição:** URL base da API de terminais da Dock
- **Valor padrão:** `https://terminal.acquiring.dock.tech`
- **Onde usar:** Endpoints de terminais POS
- **Obrigatória:** ✅ Sim

### 6. DOCK_API_URL_SERVICEORDER
- **Descrição:** URL base da API de service orders da Dock
- **Valor padrão:** `https://serviceorder.acquiring.dock.tech`
- **Onde usar:** Endpoints de links de pagamento externos
- **Obrigatória:** ✅ Sim

### 7. DOCK_API_URL_PLATAFORMA_DADOS
- **Descrição:** URL alternativa para plataforma de dados (MCC/CNAE)
- **Onde usar:** Endpoints de MCC e grupos MCC
- **Obrigatória:** ⚠️ Opcional (fallback para DOCK_API_URL)

---

## ⚙️ Variáveis Opcionais (Controle)

Estas variáveis podem ter valores diferentes entre os sistemas:

### 8. DOCK_SYNC_ENABLED
- **Descrição:** Habilita/desabilita sincronização automática da API Dock
- **Valores:** `true` ou `false`
- **Portal-Outbank:** `false` (recomendado - não faz sync automático)
- **Outbank-One:** `true` (faz sync automático)
- **Onde usar:** Funções de sincronização (sync-merchant, sync-transactions, etc.)

### 9. DOCK_WRITE_ENABLED
- **Descrição:** Habilita/desabilita escrita na API Dock
- **Valores:** `true` ou `false`
- **Portal-Outbank:** `true` (permite escrita manual)
- **Outbank-One:** `true` (permite escrita)
- **Onde usar:** Funções de create/update merchants

### 10. DOCK_X_CUSTOMER
- **Descrição:** Header X-Customer para alguns endpoints específicos
- **Onde usar:** Endpoints de payouts e antecipações
- **Obrigatória:** ⚠️ Opcional (depende do endpoint)

---

## 📝 Template de Configuração

### Para Portal-Outbank (.env.local)

```env
# ============================================
# DOCK API - Compartilhado com Outbank-One
# ============================================
# IMPORTANTE: Use os MESMOS valores do outbank-one

# Chave de Autenticação (OBRIGATÓRIA - mesma do outbank-one)
DOCK_API_KEY=eyJraWQiOiJJTlRFR1JBVElPTiIsInR5cCI6IkpXVCIsImFsZyI6IkhTNTEyIn0...

# URLs das APIs (OBRIGATÓRIAS - mesmas do outbank-one)
DOCK_API_URL_MERCHANTS=https://merchant.acquiring.dock.tech
DOCK_API_URL_SETTLEMENT=https://settlement.acquiring.dock.tech
DOCK_API_URL_TRANSACTIONS=https://transaction.acquiring.dock.tech
DOCK_API_URL_TERMINALS=https://terminal.acquiring.dock.tech
DOCK_API_URL_SERVICEORDER=https://serviceorder.acquiring.dock.tech

# URL Opcional (se usado no outbank-one)
# DOCK_API_URL_PLATAFORMA_DADOS=https://...

# ============================================
# Controles Específicos do Portal-Outbank
# ============================================
# Desabilitar sync automático (portal-outbank não faz sync)
DOCK_SYNC_ENABLED=false

# Habilitar escrita manual (permite editar merchants)
DOCK_WRITE_ENABLED=true

# Header opcional (se usado no outbank-one)
# DOCK_X_CUSTOMER=...
```

---

## 🚀 Passos para Configuração

### Passo 1: Obter Variáveis do Outbank-One

1. Acessar **Vercel Dashboard** do projeto `outbank-one`
2. Ir em **Settings > Environment Variables**
3. Copiar os valores de todas as variáveis `DOCK_*`
4. Documentar os valores encontrados

### Passo 2: Configurar Portal-Outbank Localmente

1. Abrir arquivo `.env.local` do portal-outbank
2. Adicionar todas as variáveis `DOCK_*` com os mesmos valores do outbank-one
3. Ajustar apenas `DOCK_SYNC_ENABLED=false` (específico do portal-outbank)
4. Salvar o arquivo

### Passo 3: Configurar Portal-Outbank no Vercel

1. Acessar **Vercel Dashboard** do projeto `portal-outbank`
2. Ir em **Settings > Environment Variables**
3. Adicionar todas as variáveis `DOCK_*` com os mesmos valores do outbank-one
4. Ajustar apenas `DOCK_SYNC_ENABLED=false` (específico do portal-outbank)
5. Fazer deploy para aplicar as mudanças

### Passo 4: Validação

1. Verificar se todas as variáveis estão configuradas
2. Testar conexão com API Dock (verificar logs)
3. Testar criação/atualização de merchant
4. Verificar se não há erros de autenticação

---

## ✅ Checklist de Configuração

- [ ] Variáveis obtidas do Vercel do outbank-one
- [ ] `DOCK_API_KEY` configurada (mesma do outbank-one)
- [ ] `DOCK_API_URL_MERCHANTS` configurada
- [ ] `DOCK_API_URL_SETTLEMENT` configurada
- [ ] `DOCK_API_URL_TRANSACTIONS` configurada
- [ ] `DOCK_API_URL_TERMINALS` configurada
- [ ] `DOCK_API_URL_SERVICEORDER` configurada
- [ ] `DOCK_SYNC_ENABLED=false` configurada (portal-outbank)
- [ ] `DOCK_WRITE_ENABLED=true` configurada
- [ ] Variáveis adicionadas no `.env.local`
- [ ] Variáveis adicionadas no Vercel Dashboard
- [ ] Deploy realizado
- [ ] Testes de conexão realizados
- [ ] Testes de escrita realizados

---

## 🔍 Verificação de Configuração

### Como Verificar se Está Configurado Corretamente

1. **Verificar variáveis no código:**
   ```typescript
   console.log('DOCK_API_KEY:', process.env.DOCK_API_KEY ? '✅ Configurada' : '❌ Não configurada');
   console.log('DOCK_API_URL_MERCHANTS:', process.env.DOCK_API_URL_MERCHANTS);
   ```

2. **Testar conexão:**
   - Tentar criar/atualizar um merchant
   - Verificar logs de erro
   - Verificar se a API responde corretamente

3. **Comparar com outbank-one:**
   - Verificar se os valores são idênticos (exceto `DOCK_SYNC_ENABLED`)

---

## ⚠️ Observações Importantes

### Sem Proteções de Conflito Necessárias

- **Não é necessário** implementar locks ou controle de concorrência
- **Não é necessário** validação de timestamp ou versioning
- Cada ISO só acessa seus próprios merchants (isolamento natural por `idCustomer`)

### Isolamento por ISO

- Cada merchant tem um `idCustomer` associado
- Cada ISO só pode ver/editar merchants do seu `idCustomer`
- Não há risco de um ISO editar merchants de outro ISO
- A API Dock também respeita esse isolamento

### Portal-Outbank como Backup

- Usado quando não é possível acessar outbank-one
- Permite edição manual de merchants quando necessário
- Não faz sincronização automática (apenas escrita manual)
- Mantém os mesmos dados na API Dock

---

## 📚 Referências

- **Plano de Implementação:** `PLANO-IMPLEMENTAR-ESCRITA-API-DOCK-PORTAL-OUTBANK.md`
- **Variáveis Necessárias:** `VARIAVEIS-AMBIENTE-NECESSARIAS.md`
- **Código de Integração:** `src/features/merchants/server/merchant-dock-api.ts`

---

**Última atualização:** 01 de Dezembro de 2025

