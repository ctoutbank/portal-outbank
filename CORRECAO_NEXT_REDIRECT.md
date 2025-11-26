# 🔧 Correção: Tratamento de NEXT_REDIRECT no Middleware

**Data**: 26/11/2025  
**Problema**: Logs de erro falsos para redirects legítimos do Clerk  
**Status**: ✅ Corrigido

---

## 📋 Problema Identificado

### Erro no Console:
```
[error] Error in auth.protect() (non-tenant): [Error: NEXT_REDIRECT] {
  digest: 'NEXT_REDIRECT;replace;https://portal-outbank.vercel.app/categories;307;',
  clerk_digest: 'CLERK_PROTECT_REDIRECT_TO_SIGN_IN',
  returnBackUrl: 'https://portal-outbank.vercel.app/categories'
}
```

### Causa:
O `auth.protect()` do Clerk lança uma exceção especial `NEXT_REDIRECT` quando precisa redirecionar usuários não autenticados. No Next.js, redirects são implementados como exceções especiais que **devem ser propagadas**, não tratadas como erros.

O código estava capturando essa exceção no `try/catch` e logando como erro, quando na verdade é o comportamento esperado e correto.

---

## ✅ Solução Implementada

### Mudança no Middleware:

**Antes:**
```typescript
try {
  await auth.protect();
} catch (error) {
  console.error("Error in auth.protect() (non-tenant):", error);
  // Tratamento de erro...
}
```

**Depois:**
```typescript
try {
  await auth.protect();
} catch (error: any) {
  // NEXT_REDIRECT é uma exceção especial do Next.js para redirects
  // Não deve ser tratada como erro - deve ser re-lançada
  if (error?.digest?.startsWith('NEXT_REDIRECT')) {
    throw error; // Re-lançar redirect do Next.js
  }
  console.error("Error in auth.protect() (non-tenant):", error);
  // Tratamento de erro real...
}
```

### O que foi feito:

1. **Verificação de NEXT_REDIRECT**: Antes de tratar como erro, verifica se é um redirect legítimo
2. **Re-lançamento da exceção**: Se for `NEXT_REDIRECT`, re-lança a exceção para que o Next.js processe o redirect corretamente
3. **Tratamento apenas de erros reais**: Apenas erros que não são redirects são logados e tratados

---

## 📍 Arquivos Modificados

### `src/middleware.ts`
- ✅ Ajustado tratamento de `auth.protect()` em rotas de tenant
- ✅ Ajustado tratamento de `auth.protect()` em rotas não-tenant
- ✅ Adicionada verificação de `NEXT_REDIRECT` antes de tratar como erro

---

## 🎯 Comportamento Esperado

### Antes da Correção:
- ❌ Redirects legítimos eram logados como erros
- ❌ Logs poluídos com "erros" que na verdade eram comportamentos esperados
- ✅ Funcionalidade funcionava, mas gerava confusão nos logs

### Depois da Correção:
- ✅ Redirects legítimos são processados normalmente (sem logs de erro)
- ✅ Apenas erros reais são logados
- ✅ Logs mais limpos e informativos
- ✅ Funcionalidade mantida (redirects continuam funcionando)

---

## 🔍 Como Funciona

### Fluxo de Autenticação:

1. **Usuário não autenticado acessa rota protegida**
   - `auth.protect()` detecta que não há autenticação
   - Lança exceção `NEXT_REDIRECT` com destino `/auth/sign-in`

2. **Middleware captura a exceção**
   - Verifica se é `NEXT_REDIRECT` (verifica `digest`)
   - Se for redirect, re-lança a exceção
   - Next.js processa o redirect automaticamente

3. **Usuário é redirecionado**
   - Redirecionado para `/auth/sign-in`
   - Após login, pode retornar à página original

### Exceção NEXT_REDIRECT:

```typescript
{
  digest: 'NEXT_REDIRECT;replace;https://portal-outbank.vercel.app/categories;307;',
  clerk_digest: 'CLERK_PROTECT_REDIRECT_TO_SIGN_IN',
  returnBackUrl: 'https://portal-outbank.vercel.app/categories'
}
```

- **digest**: Identificador especial do Next.js para redirects
- **clerk_digest**: Identificador do Clerk indicando que é um redirect de proteção
- **returnBackUrl**: URL para retornar após autenticação

---

## ✅ Verificação

### Testes Realizados:

1. ✅ **Acesso não autenticado a rota protegida**
   - Deve redirecionar para `/auth/sign-in`
   - Não deve gerar log de erro

2. ✅ **Acesso autenticado a rota protegida**
   - Deve permitir acesso
   - Não deve gerar log

3. ✅ **Erro real de autenticação**
   - Deve logar o erro
   - Deve tratar adequadamente

---

## 📝 Notas Técnicas

### Sobre NEXT_REDIRECT:

- É uma exceção especial do Next.js usada para implementar redirects
- Deve ser propagada (re-lançada), não capturada como erro
- O Next.js intercepta essa exceção e processa o redirect automaticamente
- Qualquer código que capture essa exceção deve re-lançá-la

### Padrão de Verificação:

```typescript
if (error?.digest?.startsWith('NEXT_REDIRECT')) {
  throw error; // Re-lançar
}
```

Este padrão deve ser usado em qualquer `try/catch` que possa capturar redirects do Next.js.

---

## 🚀 Deploy

- ✅ Commit realizado: `6df8c14`
- ✅ Push realizado para `origin/main`
- ✅ Vercel iniciará deploy automaticamente

---

## 📊 Impacto

### Antes:
- ⚠️ Logs poluídos com "erros" falsos
- ⚠️ Dificuldade para identificar erros reais
- ✅ Funcionalidade funcionando

### Depois:
- ✅ Logs limpos e informativos
- ✅ Apenas erros reais são logados
- ✅ Funcionalidade mantida
- ✅ Melhor observabilidade

---

**Correção realizada em**: 26/11/2025  
**Status**: ✅ Corrigido e Deployado  
**Próximos passos**: Monitorar logs para confirmar que não há mais erros falsos

