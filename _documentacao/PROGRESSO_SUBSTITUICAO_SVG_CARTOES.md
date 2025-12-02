# Progresso: Substituição de SVGs de Cartões por Biblioteca

## 📍 Status Atual

**Data da pausa:** [Data atual]  
**Status:** ⏸️ Pausado - Pronto para retomar

---

## ✅ O que foi feito

### 1. Análise Inicial
- ✅ Identificada a função `getCardImage` em `src/utils/actions.ts`
- ✅ Mapeados todos os arquivos que usam a função (8 arquivos encontrados):
  - `src/features/categories/_components/sections/fees-section.tsx`
  - `src/features/solicitationfee/_componentes/tax-form.tsx`
  - `src/utils/actions.ts`
  - `src/features/pricingSolicitation/_components/sections/fees-section.tsx`
  - `src/features/pricingSolicitation/_components/pricing-solicitation-view.tsx`
  - `src/components/supplier/card-image-utils.ts` (função similar)
  - `src/components/supplier/MdrForm.tsx`
  - `src/components/merchants/fee-supplier-selection.tsx`

### 2. Identificação dos SVGs Atuais
- ✅ SVGs encontrados em `/public`:
  - `american-express.svg`
  - `cabal.svg`
  - `elo.svg`
  - `hipercard.svg`
  - `mastercard.svg`
  - `visa.svg`

### 3. Pesquisa de Bibliotecas
- ✅ Verificado que `payment-icons` (já no package.json) está **deprecated**
- ✅ Pesquisada alternativa: `react-payment-logos` ou `simple-icons`
- ⚠️ Tentativa de instalar `simple-icons` foi iniciada mas não completada

---

## ⏳ O que ainda precisa ser feito

### 1. Decisão sobre Biblioteca
- [ ] Escolher biblioteca final:
  - Opção A: `react-payment-logos` (específica para cartões de pagamento)
  - Opção B: `simple-icons` (biblioteca mais ampla, inclui logos de cartões)
  - Opção C: Outra biblioteca

### 2. Instalação
- [ ] Instalar a biblioteca escolhida
- [ ] Verificar compatibilidade com React 19

### 3. Criação do Componente
- [ ] Criar componente reutilizável para exibir logos de cartões
- [ ] Mapear nomes de cartões atuais para os da biblioteca:
  - `MASTERCARD` → ?
  - `VISA` → ?
  - `ELO` → ?
  - `AMERICAN_EXPRESS` / `AMEX` → ?
  - `HIPERCARD` → ?
  - `CABAL` → ?

### 4. Atualização dos Arquivos
- [ ] Atualizar `src/utils/actions.ts` (função `getCardImage`)
- [ ] Atualizar `src/features/categories/_components/sections/fees-section.tsx`
- [ ] Atualizar `src/features/solicitationfee/_componentes/tax-form.tsx`
- [ ] Atualizar `src/features/pricingSolicitation/_components/sections/fees-section.tsx`
- [ ] Atualizar `src/features/pricingSolicitation/_components/pricing-solicitation-view.tsx`
- [ ] Atualizar `src/components/supplier/card-image-utils.ts`
- [ ] Atualizar `src/components/supplier/MdrForm.tsx`
- [ ] Atualizar `src/components/merchants/fee-supplier-selection.tsx`

### 5. Testes
- [ ] Testar todas as telas afetadas
- [ ] Verificar responsividade
- [ ] Verificar qualidade dos ícones
- [ ] Verificar se todos os cartões estão sendo exibidos corretamente

### 6. Limpeza
- [ ] Remover SVGs antigos de `/public`:
  - `american-express.svg`
  - `cabal.svg`
  - `elo.svg`
  - `hipercard.svg`
  - `mastercard.svg`
  - `visa.svg`

---

## 📝 Notas Técnicas

### Função Atual (`src/utils/actions.ts`)
```typescript
export const getCardImage = (cardName: string): string => {
    const cardMap: { [key: string]: string } = {
      MASTERCARD: "/mastercard.svg",
      VISA: "/visa.svg",
      ELO: "/elo.svg",
      AMERICAN_EXPRESS: "/american-express.svg",
      HIPERCARD: "/hipercard.svg",
      AMEX: "/american-express.svg",
      CABAL: "/cabal.svg",
    };
    return cardMap[cardName] || "";
};
```

### Função Similar (`src/components/supplier/card-image-utils.ts`)
```typescript
export function getCardImage(brandName: string): string {
  const brandMap: Record<string, string> = {
    'Visa': '/images/cards/visa.png',
    'Mastercard': '/images/cards/mastercard.png',
    'Elo': '/images/cards/elo.png',
    'Amex': '/images/cards/amex.png',
    'Hipercard': '/images/cards/hipercard.png',
  };
  return brandMap[brandName] || '';
}
```

**Observação:** Existem duas funções diferentes com nomes similares. Será necessário unificar a abordagem.

### Dependências Atuais
- `payment-icons: ^1.2.1` (deprecated, mas ainda no package.json)
- React 19.0.0
- Next.js 15.3.1

---

## 🎯 Próximos Passos (quando retomar)

1. **Decidir biblioteca** - Revisar opções e escolher a melhor
2. **Instalar biblioteca** - `npm install [biblioteca-escolhida]`
3. **Criar componente** - Componente React reutilizável
4. **Substituir usos** - Atualizar todos os 8 arquivos
5. **Testar** - Verificar todas as telas
6. **Limpar** - Remover SVGs antigos

---

## 📚 Referências

- Biblioteca `payment-icons`: https://www.npmjs.com/package/payment-icons (deprecated)
- Biblioteca `react-payment-logos`: https://www.npmjs.com/package/react-payment-logos
- Biblioteca `simple-icons`: https://www.npmjs.com/package/simple-icons

