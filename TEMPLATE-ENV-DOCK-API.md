# 📝 Template .env.local - Variáveis Dock API

Este template contém todas as variáveis necessárias para configurar a integração com a API Dock no portal-outbank.

**⚠️ IMPORTANTE:** Use os **MESMOS valores** do outbank-one para as variáveis obrigatórias.

---

## 🔑 Variáveis Obrigatórias (Copiar do Outbank-One)

```env
# ============================================
# DOCK API - Compartilhado com Outbank-One
# ============================================
# ⚠️ IMPORTANTE: Use os MESMOS valores do outbank-one

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
```

---

## ⚙️ Variáveis de Controle (Específicas do Portal-Outbank)

```env
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

## 📋 Como Usar Este Template

1. **Copiar valores do outbank-one:**
   - Acessar Vercel Dashboard do outbank-one
   - Copiar valores de `DOCK_API_KEY` e todas as URLs
   - Substituir no template acima

2. **Adicionar ao .env.local:**
   - Abrir `.env.local` do portal-outbank
   - Adicionar todas as variáveis acima
   - Salvar o arquivo

3. **Verificar configuração:**
   - Executar `npm run dev`
   - Verificar se não há erros de variáveis não encontradas

---

## ✅ Checklist

- [ ] `DOCK_API_KEY` copiada do outbank-one
- [ ] `DOCK_API_URL_MERCHANTS` configurada
- [ ] `DOCK_API_URL_SETTLEMENT` configurada
- [ ] `DOCK_API_URL_TRANSACTIONS` configurada
- [ ] `DOCK_API_URL_TERMINALS` configurada
- [ ] `DOCK_API_URL_SERVICEORDER` configurada
- [ ] `DOCK_SYNC_ENABLED=false` configurada
- [ ] `DOCK_WRITE_ENABLED=true` configurada
- [ ] Variáveis adicionadas ao `.env.local`
- [ ] Teste local realizado com sucesso

---

**Nota:** Este template deve ser usado em conjunto com o documento `CONFIGURACAO-DOCK-API-COMPARTILHADA.md` para instruções completas.

