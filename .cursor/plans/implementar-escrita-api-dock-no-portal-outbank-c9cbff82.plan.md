<!-- c9cbff82-4d03-483b-9512-b184b5d250cd d2bb4a5a-4e22-4470-a2ba-4af3c8275593 -->
# Plano: Página de Analytics de Transações

## Objetivo

Criar uma página de analytics completa (`/analytics` ou `/transactions/analytics`) que exiba métricas agregadas de transações com capacidade de comparar ISOs, seguindo o layout do dashboard databloo.

## 1. Identificação de Fontes (Dimensões e Métricas)

### Dimensões Disponíveis (Fontes de Agrupamento):

1. **Temporal**: Data (dtInsert) - dia, semana, mês, ano
2. **ISO/Customer**: customerName, slugCustomer
3. **Estabelecimento**: merchantName, slugMerchant
4. **Terminal**: terminalType, terminalLogicalNumber
5. **Status**: transactionStatus (AUTHORIZED, DENIED, PENDING, etc)
6. **Tipo de Produto**: productType (CREDIT, DEBIT, PIX)
7. **Bandeira**: brand (VISA, MASTERCARD, ELO, HIPERCARD, AMEX, CABAL)
8. **Método**: methodType
9. **Canal de Vendas**: salesChannel (PRESENTIAL, ONLINE)
10. **Moeda**: currency

### Métricas Disponíveis:

1. **Contagem**: Total de transações (COUNT)
2. **Valor Total**: Soma dos valores (SUM totalAmount)
3. **Valor Médio**: Média dos valores (AVG totalAmount)
4. **Taxa de Aprovação**: % de transações autorizadas
5. **Taxa de Negação**: % de transações negadas
6. **Taxa de Conversão**: Se houver dados de conversão (futuro)

## 2. Estrutura de Dados

### Server Actions Necessárias:

#### `src/features/transactions/serverActions/analytics.ts`

**Funções a criar:**

1. `getAnalyticsKPIs(dateFrom, dateTo, customerIds?)` 

   - Retorna: totalTransacoes, totalValor, valorMedio, taxaAprovacao, taxaNegacao
   - Suporta comparação entre múltiplos ISOs

2. `getAnalyticsTimeSeries(dateFrom, dateTo, groupBy: 'day'|'week'|'month', customerIds?)`

   - Retorna: série temporal de transações e valores ao longo do tempo
   - Agrupa por período (dia/semana/mês)

3. `getAnalyticsByDimension(dimension: string, dateFrom, dateTo, customerIds?)`

   - Retorna: agrupamento por dimensão (bandeira, produto, status, etc)
   - Suporta: brand, productType, transactionStatus, salesChannel, methodType

4. `getAnalyticsByCustomer(dateFrom, dateTo, customerIds?)`

   - Retorna: comparação entre ISOs selecionados
   - Métricas: contagem, valor total, valor médio, taxa de aprovação

5. `getAnalyticsByMerchant(dateFrom, dateTo, customerIds?, limit?)`

   - Retorna: top merchants por volume ou valor
   - Limit padrão: 10

## 3. Layout da Página (Baseado na Imagem)

### Estrutura:

```
/analytics ou /transactions/analytics
├── Header
│   ├── Título "Analytics" ou "Análise de Transações"
│   ├── Filtros: Date Range Picker
│   ├── Filtros: Seleção de ISOs (Multi-select para comparação)
│   └── Botões: Exportar, Compartilhar (futuro)
│
├── Seção 1: KPIs Cards (6 cards em linha)
│   ├── Total de Transações (com % de mudança vs período anterior)
│   ├── Valor Total (com % de mudança)
│   ├── Taxa de Aprovação (com % de mudança)
│   ├── Taxa de Negação (com % de mudança)
│   ├── Valor Médio por Transação (com % de mudança)
│   └── Taxa de Conversão (se disponível)
│
├── Seção 2: Gráficos Principais
│   ├── Gráfico Combinado (Linha + Barra)
│   │   ├── Barras: Volume de Transações por período
│   │   └── Linha: Valor Total por período
│   │   └── Eixo X: Períodos (dias/semanas/meses)
│   │   └── Eixo Y: Contagem (esquerda) e Valor (direita)
│   │
│   ├── Card Resumo: Total de Transações (com % de mudança)
│   └── Card Resumo: Valor Total (com % de mudança)
│
└── Seção 3: Breakdowns (3 gráficos lado a lado)
    ├── Gráfico 1: Transações por Bandeira (Bar Chart Vertical)
    │   └── Mostra % de transações por bandeira
    │
    ├── Gráfico 2: Transações por Tipo de Produto (Donut Chart)
    │   └── Crédito, Débito, PIX com percentuais
    │
    └── Gráfico 3: Transações por Status (Bar Chart Horizontal)
        └── Tabela com barras horizontais mostrando % de cada status
```

### Comparação entre ISOs:

- Quando múltiplos ISOs selecionados, mostrar:
  - KPIs separados por ISO (cards coloridos diferentes)
  - Gráficos com séries múltiplas (uma linha/barra por ISO)
  - Tabela comparativa de ISOs

## 4. Componentes a Criar

### `src/features/transactions/_components/analytics/`

1. **analytics-kpi-cards.tsx**

   - 6 cards de KPIs com valores, % de mudança e indicadores visuais
   - Suporta múltiplos ISOs (mostrar valores separados ou agregados)

2. **analytics-time-series-chart.tsx**

   - Gráfico combinado (Recharts: Line + Bar)
   - Suporta múltiplas séries para comparação de ISOs
   - Tooltip interativo

3. **analytics-breakdown-by-brand.tsx**

   - Bar chart vertical por bandeira
   - Mostra contagem e % de cada bandeira

4. **analytics-breakdown-by-product.tsx**

   - Donut chart por tipo de produto (Crédito/Débito/PIX)
   - Mostra percentuais

5. **analytics-breakdown-by-status.tsx**

   - Tabela com barras horizontais
   - Mostra status e % de total

6. **analytics-customer-comparison.tsx**

   - Tabela comparativa de ISOs
   - Colunas: ISO, Transações, Valor Total, Valor Médio, Taxa Aprovação
   - Suporta múltiplos ISOs lado a lado

7. **analytics-filters.tsx**

   - Date range picker
   - Multi-select de ISOs
   - Botões de ação (Exportar, etc)

## 5. Página Principal

### `src/app/analytics/page.tsx` ou `src/app/transactions/analytics/page.tsx`

- Server component que busca dados
- Passa dados para componentes client
- Gerencia estado de filtros via searchParams

## 6. Bibliotecas Necessárias

- **Recharts**: Para gráficos (já pode estar instalado)
- **date-fns** ou **luxon**: Para manipulação de datas (já tem luxon)
- **react-datepicker** ou similar: Para date range picker

## 7. Performance e Otimização

- Usar índices no banco para queries de agregação
- Cache de resultados quando possível
- Lazy loading de gráficos pesados
- Debounce em filtros de data

## 8. Permissões

- Respeitar permissões de usuário (getUserMerchantsAccess)
- Super Admin pode ver todos os ISOs
- Usuários comuns veem apenas seu ISO
- Comparação entre ISOs só para quem tem acesso a múltiplos

## 9. Fonte de Dados

- **Banco de Dados**: Consultar tabela `transactions` (dados já sincronizados da Dock)
- **Não buscar da API Dock**: Usar apenas dados do banco para performance
- **Sincronização**: Dados são atualizados via cron job (a cada 1 minuto)

## 10. Estrutura de Arquivos

```
src/
├── app/
│   └── analytics/
│       └── page.tsx (ou transactions/analytics/page.tsx)
│
├── features/
│   └── transactions/
│       ├── serverActions/
│       │   └── analytics.ts (novo)
│       └── _components/
│           └── analytics/
│               ├── analytics-kpi-cards.tsx
│               ├── analytics-time-series-chart.tsx
│               ├── analytics-breakdown-by-brand.tsx
│               ├── analytics-breakdown-by-product.tsx
│               ├── analytics-breakdown-by-status.tsx
│               ├── analytics-customer-comparison.tsx
│               └── analytics-filters.tsx
```

## 11. Implementação por Etapas

1. Criar server actions de analytics
2. Criar página base com filtros
3. Implementar cards de KPIs
4. Implementar gráfico de série temporal
5. Implementar gráficos de breakdown
6. Implementar comparação entre ISOs
7. Adicionar navegação no menu
8. Testes e ajustes de performance

### To-dos

- [ ] Tornar linhas da tabela de transações clicáveis
- [ ] Criar função server action getTransactionBySlug
- [ ] Criar página de detalhes /transactions/[slug]/page.tsx
- [ ] Criar componente TransactionDetails para exibir detalhes