# 📋 DOCUMENTAÇÃO DO PROBLEMA: CACHE DE IMAGENS NA PERSONALIZAÇÃO DE ISOs

## 📅 Data: 2025-01-XX
## 🔍 Status: PROBLEMA PERSISTENTE

---

## 🎯 RESUMO EXECUTIVO

As imagens (logo, favicon, imagem de fundo do login) e cores (primária e secundária) na personalização de ISOs **não atualizam instantaneamente** após serem salvas. Mesmo após múltiplas tentativas de correção, o problema persiste, indicando que há múltiplas camadas de cache interferindo no processo.

---

## 🏗️ ARQUITETURA E SERVIÇOS UTILIZADOS

### Stack Tecnológico

1. **Frontend:**
   - **Next.js 15.3.1** (React 19.0.0)
   - **TypeScript**
   - **Tailwind CSS**
   - Framework: App Router (Server Components + Client Components)

2. **Backend:**
   - **Next.js Server Actions** (`"use server"`)
   - **Drizzle ORM** (banco de dados)
   - **AWS SDK v3** (`@aws-sdk/client-s3`)

3. **Armazenamento:**
   - **Amazon S3** (AWS)
   - Bucket: `process.env.AWS_BUCKET_NAME`
   - Região: `process.env.AWS_REGION`
   - URLs geradas: `https://{BUCKET}.s3.{REGION}.amazonaws.com/{KEY}`

4. **Hospedagem:**
   - **Vercel** (deploy automático via GitHub)
   - CDN global da Vercel
   - Edge Network

5. **Banco de Dados:**
   - Tabela: `customerCustomization`
   - Tabela: `file` (metadados de arquivos)
   - Campos relevantes:
     - `imageUrl` (logo)
     - `loginImageUrl` (imagem de fundo)
     - `faviconUrl`
     - `primaryColor` (HSL)
     - `secondaryColor` (HSL)

---

## 🔄 FLUXO COMPLETO DE UPLOAD E EXIBIÇÃO

### 1. Upload de Imagem (Logo, Login, Favicon)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (Browser)                                           │
│ 1. Usuário seleciona arquivo                                │
│ 2. Preview local (FileReader)                               │
│ 3. Submit do formulário                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ FormData
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER ACTION (saveCustomization / updateCustomization)     │
│ 1. Recebe FormData                                          │
│ 2. Converte File → Buffer                                   │
│ 3. Gera ID único (nanoid)                                   │
│ 4. Upload para S3:                                          │
│    - Key: "logo-{id}.{ext}"                                 │
│    - CacheControl: "public, max-age=31536000, immutable"    │
│ 5. Salva URL no banco:                                      │
│    - customerCustomization.imageUrl                         │
│    - file.fileUrl                                           │
│ 6. Revalida cache:                                          │
│    - revalidatePath("/api/public/customization/{subdomain}")│
│    - revalidateTag("customization-{subdomain}")             │
└──────────────────────┬──────────────────────────────────────┘
                       │ Retorna { customization }
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE (React State)                                       │
│ 1. Atualiza customizationData                               │
│ 2. Incrementa imageVersion                                  │
│ 3. Renderiza <img src={url + ?v={version}} />              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Exibição de Imagem

```
┌─────────────────────────────────────────────────────────────┐
│ COMPONENTE: customer-wizard-form.tsx                        │
│                                                              │
│ {customizationData?.imageUrl && (                           │
│   <img                                                       │
│     src={addCacheBusting(customizationData.imageUrl)}       │
│     key={`${imageUrl}-${imageVersion}`}                     │
│   />                                                         │
│ )}                                                           │
│                                                              │
│ addCacheBusting(url) => `${url}?v=${imageVersion}`          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Requisição HTTP
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ CDN VERCEL (Edge Network)                                   │
│ - Pode ter cache próprio                                    │
│ - Cache-Control do S3 pode ser respeitado                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ AMAZON S3                                                   │
│ - Retorna imagem com headers:                               │
│   Cache-Control: public, max-age=31536000, immutable        │
│   ETag: "{hash}"                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ BROWSER                                                     │
│ - Cache HTTP (31536000s = 1 ano)                            │
│ - Cache de memória                                          │
│ - Service Worker (se houver)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## ❌ PROBLEMAS IDENTIFICADOS

### Problema 1: Cache do S3 com `immutable`

**Localização:** `src/utils/serverActions.ts` (linhas 243, 287, 331)

```typescript
CacheControl: 'public, max-age=31536000, immutable'
```

**Problema:**
- O header `immutable` diz ao browser: "Esta URL nunca vai mudar, pode cachear para sempre"
- Quando uma nova imagem é enviada, ela tem uma **nova URL** (com novo `nanoid`)
- Mas se o usuário **substitui** uma imagem existente, a URL pode ser a mesma
- O browser pode estar cacheando a URL antiga mesmo com query string diferente

**Impacto:** ⚠️ ALTO
- Imagens não atualizam mesmo com cache busting (`?v=X`)

### Problema 2: Cache do CDN da Vercel

**Localização:** Edge Network da Vercel

**Problema:**
- A Vercel tem sua própria CDN que pode cachear respostas do S3
- Mesmo com `revalidatePath` e `revalidateTag`, o cache da CDN pode persistir
- O cache busting (`?v=X`) pode não ser suficiente se a CDN não respeitar query strings

**Impacto:** ⚠️ ALTO
- Imagens podem ficar em cache na CDN mesmo após atualização

### Problema 3: Cache do Browser

**Localização:** Browser do usuário

**Problema:**
- O browser pode estar cacheando a imagem baseada na URL base (sem query string)
- Alguns browsers ignoram query strings para cache de imagens
- O `immutable` do S3 reforça o cache do browser

**Impacto:** ⚠️ MÉDIO
- Depende do browser e configurações do usuário

### Problema 4: API Route com Cache

**Localização:** `src/app/api/public/customization/[subdomain]/route.ts`

```typescript
response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10');
```

**Problema:**
- A API retorna os dados de customização (incluindo URLs)
- Mesmo com cache de 5s, pode haver delay
- O `revalidatePath` pode não estar funcionando corretamente

**Impacto:** ⚠️ BAIXO
- Já foi reduzido para 5s, mas ainda pode causar delay

### Problema 5: Estado React não sincronizado

**Localização:** `src/features/customers/_componentes/customer-wizard-form.tsx`

**Problema:**
- O `imageVersion` só incrementa após salvar
- Se a URL retornada do servidor for a mesma, o cache busting não ajuda
- O estado pode não estar refletindo a nova URL imediatamente

**Impacto:** ⚠️ MÉDIO
- Pode causar delay na atualização visual

---

## 🔧 SOLUÇÕES JÁ TENTADAS

### Tentativa 1: Cache Busting com Query String
- ✅ Implementado: `addCacheBusting(url) => ${url}?v=${imageVersion}`
- ❌ **Resultado:** Não resolveu completamente

### Tentativa 2: Substituir Next.js Image por `<img>` nativo
- ✅ Implementado: Troca de `<Image>` para `<img>`
- ❌ **Resultado:** Não resolveu completamente

### Tentativa 3: Remover `router.refresh()`
- ✅ Implementado: Removido para não sobrescrever estado
- ❌ **Resultado:** Não resolveu completamente

### Tentativa 4: Inputs controlados para cores
- ✅ Implementado: `defaultValue` → `value`
- ❌ **Resultado:** Cores ainda não atualizam instantaneamente

### Tentativa 5: Reduzir cache da API
- ✅ Implementado: `max-age=5, stale-while-revalidate=10`
- ❌ **Resultado:** Não resolveu completamente

### Tentativa 6: Revalidação de cache
- ✅ Implementado: `revalidatePath` e `revalidateTag`
- ❌ **Resultado:** Não resolveu completamente

---

## 🎯 CAUSA RAIZ PROVÁVEL

O problema está em **múltiplas camadas de cache** trabalhando em conjunto:

1. **S3 com `immutable`**: O browser cacheia a URL base
2. **CDN da Vercel**: Pode estar cacheando respostas do S3
3. **Browser**: Cache HTTP agressivo devido ao `immutable`
4. **Query string ignorada**: Alguns sistemas ignoram query strings para cache

**O cache busting com query string (`?v=X`) não está sendo suficiente** porque:
- O S3 retorna `immutable`, então o browser pode ignorar a query string
- A CDN pode estar servindo a versão em cache
- A URL base pode ser a mesma se o `nanoid` for reutilizado (improvável, mas possível)

---

## 💡 SOLUÇÕES PROPOSTAS

### Solução 1: Remover `immutable` do S3 ⭐ RECOMENDADA

**Mudança:**
```typescript
// ANTES
CacheControl: 'public, max-age=31536000, immutable'

// DEPOIS
CacheControl: 'public, max-age=3600, must-revalidate'
```

**Vantagens:**
- Permite revalidação
- Browser pode verificar se há nova versão
- Mantém cache por 1 hora (suficiente para performance)

**Desvantagens:**
- Mais requisições ao S3 (mas com ETag, pode ser 304 Not Modified)

### Solução 2: Sempre gerar nova URL (já implementado parcialmente)

**Status:** ✅ Já está usando `nanoid` para gerar IDs únicos

**Melhoria possível:**
- Garantir que URLs antigas sejam deletadas do S3
- Verificar se não há reutilização de IDs

### Solução 3: Forçar revalidação via ETag

**Implementação:**
- Adicionar header `Cache-Control: no-cache` temporariamente após upload
- Ou usar `ETag` para validação condicional

### Solução 4: Usar CloudFront com invalidação

**Implementação:**
- Configurar CloudFront na frente do S3
- Invalidar cache após upload: `POST /2020-05-31/distribution/{id}/invalidation`

**Vantagens:**
- Controle total sobre cache
- Invalidação imediata

**Desvantagens:**
- Requer configuração adicional
- Custo adicional (CloudFront)

### Solução 5: Atualização forçada no cliente

**Implementação:**
```typescript
// Após salvar, forçar reload da imagem
const img = document.querySelector(`img[src*="${imageUrl}"]`);
if (img) {
  img.src = `${imageUrl}?v=${Date.now()}&force=true`;
}
```

**Vantagens:**
- Simples de implementar
- Funciona imediatamente

**Desvantagens:**
- Não resolve cache do S3/CDN
- Apenas workaround

---

## 📊 PRIORIZAÇÃO DE SOLUÇÕES

| Solução | Complexidade | Eficácia | Prioridade |
|---------|--------------|----------|------------|
| Remover `immutable` | ⭐ Baixa | ⭐⭐⭐ Alta | 🔥 ALTA |
| CloudFront + Invalidação | ⭐⭐⭐ Alta | ⭐⭐⭐ Alta | ⚠️ MÉDIA |
| Forçar reload no cliente | ⭐ Baixa | ⭐⭐ Média | ⚠️ MÉDIA |
| ETag validation | ⭐⭐ Média | ⭐⭐ Média | ⚠️ BAIXA |

---

## 🔍 PONTOS DE INVESTIGAÇÃO ADICIONAL

1. **Verificar se URLs estão mudando:**
   - Logar a URL antes e depois do upload
   - Confirmar que `nanoid` sempre gera IDs únicos

2. **Verificar headers HTTP:**
   - Inspecionar resposta do S3 no Network tab
   - Verificar se `Cache-Control` está correto
   - Verificar `ETag` e `Last-Modified`

3. **Testar em diferentes browsers:**
   - Chrome, Firefox, Safari
   - Modo anônimo vs normal
   - Com e sem extensões

4. **Verificar cache da Vercel:**
   - Logs de deploy
   - Configurações de cache na Vercel
   - Edge Network settings

5. **Testar diretamente no S3:**
   - Acessar URL diretamente no browser
   - Verificar se imagem atualiza
   - Testar com query strings diferentes

---

## 📝 NOTAS TÉCNICAS

### Estrutura de URLs

```
Logo:     https://{BUCKET}.s3.{REGION}.amazonaws.com/logo-{nanoid}.{ext}
Login:    https://{BUCKET}.s3.{REGION}.amazonaws.com/login-{nanoid}.{ext}
Favicon:  https://{BUCKET}.s3.{REGION}.amazonaws.com/favicon-{nanoid}.{ext}
```

### Variáveis de Ambiente Necessárias

```env
AWS_BUCKET_NAME=file-upload-outbank
AWS_REGION=us-east-1 (ou outra região)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Funções Principais

- `saveCustomization()`: Cria nova customização
- `updateCustomization()`: Atualiza customização existente
- `getCustomizationBySubdomain()`: Busca customização
- `removeImage()`: Remove imagem específica
- `removeAllImages()`: Remove todas as imagens

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. ✅ **Imediato:** Remover `immutable` do `CacheControl` no S3
2. ✅ **Curto prazo:** Implementar invalidação forçada no cliente após upload
3. ⚠️ **Médio prazo:** Considerar CloudFront se problema persistir
4. 📊 **Monitoramento:** Adicionar logs para rastrear URLs e cache hits

---

## 📞 CONTATO E SUPORTE

Para mais informações sobre este problema, consulte:
- Arquivo: `src/utils/serverActions.ts`
- Componente: `src/features/customers/_componentes/customer-wizard-form.tsx`
- API Route: `src/app/api/public/customization/[subdomain]/route.ts`

---

**Última atualização:** 2025-01-XX
**Versão do documento:** 1.0

