# Enumeração Completa de Dados de Transação

## Objetivo
Documentar todos os campos e dados disponíveis relacionados a uma transação para criação de uma página completa de detalhes.

---

## 1. Dados da Tabela `transactions` (Banco de Dados)

### Campos Principais (29 campos)

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `slug` | UUID (PK) | Identificador único da transação | ✅ Sim |
| `active` | Boolean | Status ativo/inativo | ❌ Não |
| `dtInsert` | Timestamp | Data/hora de inserção | ✅ Sim |
| `dtUpdate` | Timestamp | Data/hora de atualização | ✅ Sim |
| `slugAuthorizer` | String (250) | Slug do autorizador | ❌ Não |
| `slugTerminal` | String (250) | Slug do terminal | ✅ Sim (via join) |
| `slugMerchant` | String (250) | Slug do estabelecimento | ✅ Sim (via join) |
| `merchantType` | String (250) | Tipo do merchant | ❌ Não |
| `merchantName` | String (500) | Nome do estabelecimento | ✅ Sim |
| `merchantCorporateName` | String (500) | Razão social do estabelecimento | ✅ Sim |
| `slugCustomer` | String (250) | Slug do ISO/customer | ✅ Sim (via customerName) |
| `customerName` | String (250) | Nome do ISO | ✅ Sim |
| `salesChannel` | String (50) | Canal de vendas | ✅ Sim |
| `authorizerMerchantId` | String (50) | ID do merchant no autorizador | ✅ Sim |
| `muid` | String (50) | NSU (Merchant Unique Identifier) | ✅ Sim |
| `currency` | String (10) | Moeda | ✅ Sim |
| `totalAmount` | Numeric (15,2) | Valor total da transação | ✅ Sim |
| `transactionStatus` | String (50) | Status da transação | ✅ Sim |
| `productType` | String (50) | Tipo de produto (Crédito/Débito/PIX) | ✅ Sim |
| `rrn` | String (50) | Retrieval Reference Number | ✅ Sim |
| `firstDigits` | String (10) | Primeiros dígitos do cartão | ✅ Sim |
| `lastdigits` | String (10) | Últimos dígitos do cartão | ✅ Sim |
| `productorissuer` | String (50) | Produto ou emissor | ✅ Sim |
| `settlementmanagementtype` | String (50) | Tipo de gestão de liquidação | ✅ Sim |
| `methodType` | String (50) | Método de processamento | ✅ Sim |
| `brand` | String (50) | Bandeira do cartão | ✅ Sim |
| `cancelling` | Boolean | Indica se é cancelamento | ✅ Sim |
| `splitType` | String (50) | Tipo de split | ✅ Sim |

---

## 2. Dados Relacionados (via JOINs)

### 2.1. Tabela `merchants` (Estabelecimento)

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `merchants.name` | String | Nome do estabelecimento | ✅ Sim |
| `merchants.idDocument` | String | CNPJ do estabelecimento | ✅ Sim |
| `merchants.corporateName` | String | Razão social | ✅ Sim |
| `merchants.email` | String | Email do estabelecimento | ❌ Não |
| `merchants.phone` | String | Telefone do estabelecimento | ❌ Não |
| `merchants.idCategory` | Integer | ID da categoria (CNAE) | ❌ Não |
| `merchants.slugCategory` | String | Slug da categoria | ❌ Não |
| `merchants.idAddress` | Integer | ID do endereço | ❌ Não |

### 2.2. Tabela `terminals` (Terminal)

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `terminals.type` | Char (1) | Tipo do terminal (P/V) | ✅ Sim |
| `terminals.logicalNumber` | String (50) | Número lógico do terminal | ✅ Sim |
| `terminals.serialNumber` | String (50) | Número de série | ❌ Não |
| `terminals.model` | String (255) | Modelo do terminal | ❌ Não |
| `terminals.manufacturer` | String (50) | Fabricante | ❌ Não |
| `terminals.status` | String (50) | Status do terminal | ❌ Não |
| `terminals.pinpadSerialNumber` | String (50) | Número de série do pinpad | ❌ Não |
| `terminals.pinpadFirmware` | String (50) | Firmware do pinpad | ❌ Não |

### 2.3. Tabela `customers` (ISO)

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `customers.name` | String | Nome do ISO | ✅ Sim (via customerName) |
| `customers.slug` | String | Slug do ISO | ❌ Não |
| `customers.customerId` | String | ID do customer na Dock | ❌ Não |
| `customers.settlementManagementType` | String | Tipo de gestão de liquidação | ❌ Não |

### 2.4. Tabela `authorizers` (Autorizador) - Se existir

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `authorizers.name` | String | Nome do autorizador | ❌ Não |
| `authorizers.slug` | String | Slug do autorizador | ❌ Não |

**Nota:** A tabela `authorizers` pode não existir no schema atual. O campo `slugAuthorizer` está na tabela `transactions`, mas não há JOIN implementado.

---

## 3. Dados da API Dock (Não Armazenados no Banco)

### 3.1. Objetos Relacionados da API

Quando a transação é buscada da API Dock, ela vem com objetos relacionados:

```typescript
{
  authorizer: {
    id: string;
    name: string;
  },
  terminal: {
    id: string;
    name: string;
  },
  merchant: {
    id: string;
    name: string;
  },
  customer: {
    id: string;
    name: string;
  }
}
```

**Campos não armazenados:**
- `authorizerTerminalId` - ID do terminal no autorizador (existe na API, mas não está sendo salvo)
- Dados completos do `authorizer` (nome, etc)
- Dados completos do `terminal` (nome, etc)

---

## 4. Tabela `transaction_cycles` (Ciclos de Transação)

Esta tabela contém informações detalhadas sobre os ciclos de processamento da transação:

| Campo | Tipo | Descrição | Atualmente Exibido? |
|-------|------|-----------|---------------------|
| `slug` | String (PK) | Identificador único do ciclo | ❌ Não |
| `active` | Boolean | Status ativo/inativo | ❌ Não |
| `dtInsert` | Timestamp | Data de inserção | ❌ Não |
| `dtUpdate` | Timestamp | Data de atualização | ❌ Não |
| `slugTransaction` | String (255) | Slug da transação relacionada | ❌ Não |
| `processingDate` | Timestamp | Data de processamento | ❌ Não |
| `cycleType` | String (50) | Tipo de ciclo | ❌ Não |
| `cycleStatus` | String (50) | Status do ciclo | ❌ Não |
| `deviceStan` | String (50) | STAN do dispositivo | ❌ Não |
| `gatewayStan` | String (50) | STAN do gateway | ❌ Não |
| `responseCode` | String (10) | Código de resposta | ❌ Não |
| `gatewayVersion` | String (50) | Versão do gateway | ❌ Não |
| `trackingNumber` | String (50) | Número de rastreamento | ❌ Não |
| `amount` | Numeric (18,2) | Valor do ciclo | ❌ Não |
| `interest` | Numeric (18,2) | Juros | ❌ Não |
| `authorizationCode` | String (50) | Código de autorização | ❌ Não |
| `rrn` | String (50) | RRN do ciclo | ❌ Não |
| `connectionMode` | String (50) | Modo de conexão | ❌ Não |
| `connectionDetail` | String (500) | Detalhes da conexão | ❌ Não |
| `application` | String (50) | Aplicação | ❌ Não |
| `applicationVersion` | String (50) | Versão da aplicação | ❌ Não |
| `transmissionDate` | Timestamp | Data de transmissão | ❌ Não |
| `entryMode` | String (50) | Modo de entrada | ❌ Não |
| `requestToken` | String (255) | Token da requisição | ❌ Não |
| `confirmed` | Boolean | Confirmado | ❌ Não |
| `authorizerResponseCode` | String (10) | Código de resposta do autorizador | ❌ Não |
| `authorizerResponseMessage` | String (255) | Mensagem de resposta do autorizador | ❌ Não |
| `originalStan` | String (50) | STAN original | ❌ Não |
| `installments` | String (50) | Parcelas | ❌ Não |
| `installmenttype` | String (50) | Tipo de parcelamento | ❌ Não |

**Relacionamento:** `transaction_cycles.slugTransaction` → `transactions.slug`

---

## 5. Dados Calculados/Derivados

### 5.1. Labels e Descrições

Atualmente existem funções de lookup para converter códigos em labels:

- `getTransactionStatusLabel(status)` - Status da transação
- `getTransactionProductTypeLabel(type)` - Tipo de produto
- `getCardPaymentMethodLabel(method)` - Método de pagamento
- `getProcessingTypeLabel(channel)` - Canal de processamento
- `getTerminalTypeLabel(type)` - Tipo de terminal

### 5.2. Formatação

- `formatCurrency(amount)` - Formatação de moeda
- `formatCNPJ(document)` - Formatação de CNPJ
- `convertUTCToSaoPaulo(date)` - Conversão de data/hora

---

## 6. Resumo: Campos Não Exibidos Atualmente

### Campos da Tabela `transactions`:
- ❌ `active` - Status ativo/inativo
- ❌ `slugAuthorizer` - Slug do autorizador
- ❌ `merchantType` - Tipo do merchant

### Campos Relacionados:
- ❌ `merchants.email` - Email do estabelecimento
- ❌ `merchants.phone` - Telefone do estabelecimento
- ❌ `merchants.idCategory` / `slugCategory` - Categoria/CNAE
- ❌ `terminals.serialNumber` - Número de série do terminal
- ❌ `terminals.model` - Modelo do terminal
- ❌ `terminals.manufacturer` - Fabricante
- ❌ `terminals.status` - Status do terminal
- ❌ `terminals.pinpadSerialNumber` - Serial do pinpad
- ❌ `terminals.pinpadFirmware` - Firmware do pinpad
- ❌ `customers.slug` - Slug do ISO
- ❌ `customers.customerId` - ID do customer na Dock
- ❌ Dados do `authorizer` (nome, etc)

### Tabela `transaction_cycles` (Completa):
- ❌ Todos os 29 campos da tabela `transaction_cycles`

---

## 7. Estrutura de Dados Completa Sugerida

### 7.1. Informações Básicas da Transação
- Slug, NSU, Status, Datas (Insert/Update)
- Valor, Moeda
- Active (status ativo/inativo)

### 7.2. Informações do Estabelecimento
- Nome, CNPJ, Razão Social
- Email, Telefone
- Categoria/CNAE
- Endereço completo (via `addresses`)

### 7.3. Informações do Terminal
- Tipo, Número Lógico
- Número de Série, Modelo, Fabricante
- Status, Pinpad (Serial, Firmware)

### 7.4. Informações do ISO
- Nome, Slug, Customer ID
- Tipo de Gestão de Liquidação

### 7.5. Informações do Autorizador
- Nome, Slug
- ID do Merchant no Autorizador
- ID do Terminal no Autorizador

### 7.6. Informações do Pagamento
- Tipo de Produto, Bandeira
- Método de Processamento, Canal de Vendas
- RRN, Primeiros/Últimos Dígitos
- Produto/Emissor
- Tipo de Gestão de Liquidação
- Tipo de Split
- Cancelamento

### 7.7. Ciclos de Transação (transaction_cycles)
- Todos os 29 campos relacionados aos ciclos
- Múltiplos ciclos podem existir para uma transação

---

## 8. Recomendações para Implementação

### 8.1. Expandir `getTransactionBySlug`

Adicionar JOINs para:
- `authorizers` (se a tabela existir)
- `addresses` (via `merchants.idAddress`)
- `categories` (via `merchants.idCategory`)
- `transaction_cycles` (LEFT JOIN para múltiplos ciclos)

### 8.2. Buscar Dados da API Dock (Opcional)

Para dados não armazenados, fazer requisição direta à API Dock:
```
GET /v1/financial_transactions?slug={slug}
```

### 8.3. Estrutura de Página Sugerida

1. **Card: Informações Principais**
   - NSU, Status, Valor, Datas, Active

2. **Card: Estabelecimento**
   - Dados completos do merchant + endereço

3. **Card: Terminal**
   - Dados completos do terminal

4. **Card: ISO**
   - Dados do customer

5. **Card: Autorizador**
   - Dados do authorizer

6. **Card: Pagamento**
   - Todos os campos de pagamento

7. **Card: Ciclos de Transação** (se houver)
   - Lista de todos os ciclos relacionados

---

## 9. Total de Campos Disponíveis

- **Tabela `transactions`:** 29 campos
- **Tabela `merchants` (relacionados):** ~30 campos
- **Tabela `terminals` (relacionados):** ~15 campos
- **Tabela `customers` (relacionados):** ~10 campos
- **Tabela `transaction_cycles`:** 29 campos (pode ter múltiplos registros)
- **Tabela `addresses` (via merchant):** ~9 campos
- **Tabela `categories` (via merchant):** ~10 campos

**Total estimado:** ~132 campos únicos (sem contar múltiplos ciclos)

---

## 10. Próximos Passos

1. Verificar se a tabela `authorizers` existe no schema
2. Verificar se há dados em `transaction_cycles` para transações
3. Decidir se buscar dados adicionais da API Dock ou apenas do banco
4. Criar função expandida `getTransactionBySlug` com todos os JOINs
5. Criar componente de página com todos os cards organizados

---

**Documento criado em:** 2025-01-28
**Baseado em:** Schema do banco de dados, código existente e tipos da API Dock


