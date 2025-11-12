# 📊 Guia do Dashboard Administrativo

## 🎯 O que foi criado

Este repositório agora possui um **dashboard administrativo completo** para gerenciar tenants de adquirência.

---

## 📍 Páginas Disponíveis

### 1️⃣ Dashboard Principal
**URL:** `/admin`

**Funcionalidades:**
- ✅ Contador total de Tenants
- ✅ Contador total de ISOs
- ✅ Contador total de Estabelecimentos
- ✅ Cards clicáveis para navegação
- ✅ Explicação da estrutura do sistema

**Preview:**
```
╔═══════════════════════════════════════════╗
║     PAINEL ADMINISTRATIVO                 ║
╚═══════════════════════════════════════════╝

[🏢 Tenants: X]  [👥 ISOs: Y]  [🏪 Merchants: Z]
```

---

### 2️⃣ Página de Tenants
**URL:** `/admin/tenants`

**Funcionalidades:**
- ✅ Total de tenants cadastrados
- ✅ Tabela completa com todos os tenants
- ✅ Visualização de:
  - ID
  - Nome
  - Slug (subdomínio)
  - Customer ID
  - Cores personalizadas (preview)
  - Logo
  - Data de criação

**Tabela exemplo:**
| ID | Nome | Slug | Customer ID | Cor | Logo | Criado em |
|----|------|------|-------------|-----|------|-----------|
| 1  | OutBank | outbank | cust_123 | 🟦 #0066CC | 🖼️ | 2024-01-01 |

---

### 3️⃣ Página de ISOs
**URL:** `/admin/isos`

**Funcionalidades:**
- ✅ Total de ISOs ativos
- ✅ Tabela completa com todos os ISOs
- ✅ Visualização de:
  - ID
  - Nome
  - Customer ID
  - Slug
  - Tipo de liquidação
  - ID Parent

**Tabela exemplo:**
| ID | Nome | Customer ID | Slug | Tipo | Parent |
|----|------|-------------|------|------|--------|
| 1  | ISO Parceiro A | iso_001 | iso-a | SPLIT | - |

---

## 🔌 APIs Disponíveis

### 1. Contagem de Tenants
```bash
GET /api/admin/count-tenants

Response:
{
  "success": true,
  "total": 5,
  "tenants": [...]
}
```

### 2. Contagem de ISOs
```bash
GET /api/admin/count-isos

Response:
{
  "success": true,
  "total": 12,
  "isos": [...]
}
```

---

## 🚀 Como Usar

### Desenvolvimento Local
```bash
# 1. Configure as variáveis de ambiente
cp .env.example .env.local
# Adicione: POSTGRES_URL=sua_connection_string

# 2. Instale as dependências
npm install

# 3. Execute o servidor
npm run dev

# 4. Acesse no navegador
http://localhost:3000/admin
```

### Em Produção
```bash
# Acesse diretamente:
https://seu-dominio.com/admin
https://seu-dominio.com/admin/isos
https://seu-dominio.com/admin/tenants
```

---

## 📊 Estrutura do Sistema

```
┌─────────────────────────────────────────┐
│  🏢 TENANT (Empresa de Adquirência)     │
│     - OutBank                            │
│     - Customização (cores, logo)         │
│     - Domínio próprio                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  👥 ISO (Parceiro de Vendas)            │
│     - Vende serviços do tenant          │
│     - Gerencia estabelecimentos         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  🏪 ESTABELECIMENTO (Merchant)          │
│     - Loja física ou e-commerce         │
│     - Processa transações               │
│     - Cliente final                      │
└─────────────────────────────────────────┘
```

---

## 🎨 Design

- ✅ **Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Dark/Light Mode** - Suporte a temas
- ✅ **Componentes shadcn/ui** - Design moderno
- ✅ **Tabelas interativas** - Fácil navegação
- ✅ **Cards clicáveis** - Navegação intuitiva

---

## 🔐 Segurança

**IMPORTANTE:** Estas páginas administrativas devem ser protegidas!

Recomendações:
1. Adicionar autenticação (Clerk já está configurado)
2. Verificar roles/permissões de admin
3. Adicionar middleware de proteção
4. Logs de auditoria

**Exemplo de proteção:**
```typescript
// src/middleware.ts
if (pathname.startsWith('/admin')) {
  // Verificar se usuário é admin
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return redirect('/');
  }
}
```

---

## 📈 Próximos Passos Sugeridos

1. ✅ Adicionar filtros nas tabelas
2. ✅ Exportar dados para CSV/Excel
3. ✅ Gráficos e visualizações
4. ✅ Logs de atividades
5. ✅ Gestão de usuários admin
6. ✅ Webhooks e integrações

---

## 💡 Dicas

- Use `/admin` como ponto de entrada principal
- Todas as páginas são **server-side** (mais rápidas)
- Os dados são sempre atualizados (`dynamic = "force-dynamic"`)
- As queries são otimizadas com Drizzle ORM

---

## 🆘 Troubleshooting

### Erro: "No database connection"
```bash
# Verifique se POSTGRES_URL está definida
echo $POSTGRES_URL

# Configure no .env.local
POSTGRES_URL=postgresql://user:pass@host:5432/db
```

### Página retorna dados vazios
```bash
# Verifique se há dados no banco
npm run drizzle-kit studio

# Ou execute migrations
npm run drizzle-kit push
```

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o dashboard administrativo:
- 📧 Email: suporte@outbank.com
- 📚 Documentação: /docs
- 🐛 Issues: GitHub Issues

---

**Criado com ❤️ para Portal OutBank**
