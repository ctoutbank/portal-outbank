# 🔧 Correção Necessária: www.outbank.cloud

**Data**: 26/11/2025  
**Problema**: `500: INTERNAL_SERVER_ERROR Code: MIDDLEWARE_INVOCATION_FAILED` em `www.outbank.cloud`  
**Status**: ⚠️ Correção precisa ser aplicada no projeto `outbank-one`

---

## 📋 Situação Atual

### Dois Projetos Separados:

1. **portal-outbank** (este repositório)
   - Domínio: `portal-outbank.vercel.app` / `consolle.one`
   - ✅ **Correção já aplicada** (commit `3c116e9`)

2. **outbank-one** (repositório separado)
   - Domínio: `www.outbank.cloud`
   - ❌ **Correção ainda não aplicada**
   - Repositório: `github.com/ctoutbank/outbank-one`

---

## ⚠️ Problema Identificado

O erro `MIDDLEWARE_INVOCATION_FAILED` está ocorrendo em ambos os projetos porque ambos usam o mesmo padrão de middleware com `auth.protect()`. A correção aplicada no `portal-outbank` precisa ser replicada no `outbank-one`.

---

## ✅ Solução

### Aplicar a mesma correção no projeto `outbank-one`:

1. **Acessar o repositório `outbank-one`**:
   ```bash
   git clone https://github.com/ctoutbank/outbank-one.git
   cd outbank-one
   ```

2. **Aplicar a mesma correção no `src/middleware.ts`**:

   **Mudança necessária:**
   - Em vez de re-lançar `NEXT_REDIRECT`, fazer redirect manual
   - Verificar `userId` antes de chamar `auth.protect()`
   - Fazer redirect manual quando detectar `NEXT_REDIRECT`

   **Código a aplicar:**
   ```typescript
   if (!isPublicRoute(request)) {
     // Verificar autenticação antes de proteger
     if (!userId) {
       const signInUrl = new URL("/auth/sign-in", request.url);
       signInUrl.searchParams.set("redirect_url", request.url);
       return NextResponse.redirect(signInUrl);
     }
     
     // Se houver userId, tentar proteger (pode lançar NEXT_REDIRECT)
     try {
       await auth.protect();
     } catch (error: any) {
       // NEXT_REDIRECT é uma exceção especial do Next.js para redirects
       // Em vez de re-lançar, fazer redirect manualmente para evitar erro no clerkMiddleware
       if (error?.digest?.startsWith('NEXT_REDIRECT')) {
         // Extrair URL de redirect do erro ou usar sign-in padrão
         const redirectUrl = error?.returnBackUrl || "/auth/sign-in";
         const signInUrl = new URL(redirectUrl.includes("/auth/sign-in") ? redirectUrl : "/auth/sign-in", request.url);
         if (!signInUrl.searchParams.has("redirect_url")) {
           signInUrl.searchParams.set("redirect_url", request.url);
         }
         return NextResponse.redirect(signInUrl);
       }
       console.error("Error in auth.protect():", error);
       // Se houver erro real e não houver userId, redirecionar para sign-in
       if (!userId) {
         const signInUrl = new URL("/auth/sign-in", request.url);
         signInUrl.searchParams.set("redirect_url", request.url);
         return NextResponse.redirect(signInUrl);
       }
       // Se houver userId mas auth.protect() falhou, permitir continuar
     }
   }
   ```

3. **Commit e push**:
   ```bash
   git add src/middleware.ts
   git commit -m "fix: evitar MIDDLEWARE_INVOCATION_FAILED fazendo redirect manual em vez de re-lançar NEXT_REDIRECT"
   git push origin main
   ```

---

## 🔍 Verificação

### Arquivo a modificar no `outbank-one`:
- `src/middleware.ts`

### O que verificar:
1. ✅ Se o arquivo `src/middleware.ts` existe
2. ✅ Se há chamadas a `auth.protect()` dentro de `try/catch`
3. ✅ Se há re-lançamento de exceções `NEXT_REDIRECT`
4. ✅ Aplicar a mesma lógica de redirect manual

---

## 📊 Diferenças entre os Projetos

### portal-outbank:
- Domínio primário: `consolle.one`
- **NÃO** usa Satellite Domains
- Middleware com lógica de tenant/subdomain

### outbank-one:
- Domínio: `www.outbank.cloud`
- **USA** Satellite Domains (`CLERK_DOMAIN`, `CLERK_IS_SATELLITE`)
- Middleware pode ter lógica similar ou diferente

**Importante**: A correção do middleware é a mesma, mas pode haver diferenças na estrutura do código. Verificar o arquivo `src/middleware.ts` do `outbank-one` antes de aplicar.

---

## 🚀 Passos Recomendados

### 1. Verificar estrutura do `outbank-one`:
```bash
# No repositório outbank-one
cat src/middleware.ts
```

### 2. Aplicar correção:
- Usar o mesmo padrão aplicado no `portal-outbank`
- Adaptar conforme necessário para a estrutura do `outbank-one`

### 3. Testar:
- Acessar `www.outbank.cloud`
- Verificar se não há mais erro `MIDDLEWARE_INVOCATION_FAILED`
- Verificar se redirects funcionam corretamente

### 4. Deploy:
- Push para `main` no `outbank-one`
- Vercel fará deploy automaticamente
- Aguardar propagação (5-10 minutos)

---

## 📝 Notas Importantes

### Sobre Satellite Domains:

O `outbank-one` usa Satellite Domains do Clerk, o que significa:
- Compartilha sessões de autenticação com o domínio primário
- Pode ter configurações específicas de middleware
- A correção do middleware deve funcionar da mesma forma

### Sobre Cache:

Após aplicar a correção:
- Aguardar 5-10 minutos para propagação
- Limpar cache do navegador
- Testar em aba anônima

---

## ✅ Checklist

- [ ] Acessar repositório `outbank-one`
- [ ] Verificar arquivo `src/middleware.ts`
- [ ] Aplicar correção (redirect manual em vez de re-lançar `NEXT_REDIRECT`)
- [ ] Testar localmente (se possível)
- [ ] Commit e push
- [ ] Aguardar deploy no Vercel
- [ ] Testar `www.outbank.cloud`
- [ ] Verificar se erro não ocorre mais

---

## 🔗 Referências

- Correção aplicada no `portal-outbank`: commit `3c116e9`
- Documentação completa: `CORRECAO_MIDDLEWARE_INVOCATION_FAILED.md`
- Repositório `outbank-one`: `github.com/ctoutbank/outbank-one`

---

**Status**: ⚠️ Aguardando aplicação da correção no projeto `outbank-one`  
**Prioridade**: 🔴 Alta (site fora do ar)  
**Tempo estimado**: 10-15 minutos

