# Portal Outbank - Arquitetura do Sistema

**Data de Documentação:** 12 de Novembro de 2025

## Visão Geral da Arquitetura

O sistema Portal Outbank utiliza uma arquitetura **multi-tenant** onde um portal administrativo central gerencia múltiplas instâncias isoladas (ISOs).

## Componentes Principais

### 1. Portal Administrativo (Console)
- **URL:** https://portal-outbank.vercel.app/
- **Função:** Console de gerenciamento central do sistema
- **Responsabilidades:**
  - Criar e gerenciar ISOs (instâncias isoladas)
  - Configurar ambientes para cada cliente
  - Administração centralizada de todos os tenants

### 2. ISOs (Instâncias Isoladas)
Cada ISO representa uma instância separada e isolada do portal para um cliente específico.

**ISOs Atualmente Cadastrados (Total: 3):**

1. **Banco Prisma (Outbank)**
   - URL: https://bancoprisma.outbank.cloud/
   - Tipo de Gerenciamento de Liquidação: CIP
   - Status: Produção

2. **Lopes**
   - Tipo de Gerenciamento de Liquidação: CIP
   - Status: Ativo

3. **teste50000**
   - Status: Ambiente de testes

## Diferenças entre Portal Administrativo e ISOs

### Portal Administrativo
- ✅ Tem menu "ISOS" para gerenciar instâncias
- ✅ Acesso a configurações globais do sistema
- ✅ Pode criar novos ambientes/ISOs
- ✅ Gerencia múltiplos clientes

### Portal ISO (ex: bancoprisma.outbank.cloud)
- ❌ NÃO tem menu "ISOS"
- ✅ Menu específico para operações do cliente
- ✅ Dashboard com dados do estabelecimento
- ✅ Gestão de transações, terminais, merchants, etc.
- ✅ Isolado de outros ISOs

## Fluxo de Criação de Novo Cliente

1. Acesso ao Portal Administrativo (portal-outbank.vercel.app)
2. Menu "ISOS" → "+ Novo Iso"
3. Configuração do novo ISO (nome, tipo de liquidação, etc.)
4. Sistema cria nova instância isolada
5. Cliente acessa seu próprio domínio (ex: cliente.outbank.cloud)

## Credenciais de Acesso

### Portal Administrativo
- Email: cto@outbank.com.br
- Senha: cto@outbank.com.br

### ISOs (Banco Prisma)
- Email: cto@outbank.com.br
- Senha: cto@outbank.com.br

## Observações Importantes

- Cada ISO é completamente isolado dos outros
- O portal administrativo é a única interface que visualiza todos os ISOs
- Alterações no portal administrativo podem afetar todos os ISOs
- Cada ISO pode ter suas próprias configurações e customizações

## Histórico de Mudanças

- **12/11/2025:** Documentação inicial da arquitetura
- **12/11/2025:** Identificados 3 ISOs ativos no sistema
- **12/11/2025:** Corrigido problema de autenticação no middleware (PR #32)

---

**Última Atualização:** 12 de Novembro de 2025, 21:46 UTC
**Documentado por:** Devin AI
**Validado por:** CTO Outbank (cto@outbank.com.br)
