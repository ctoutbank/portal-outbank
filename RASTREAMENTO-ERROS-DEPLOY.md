# 🔍 Sistema de Rastreamento de Erros de Deploy por Commit

## 📊 Como Funciona

**Sim, consigo identificar qual commit causou cada erro!**

### Como vou identificar:

1. **Analisar o log de erro da Vercel**
   - Identificar o arquivo que causou o erro
   - Identificar a linha específica (se disponível)
   - Identificar o tipo de erro (syntax, import, runtime, etc.)

2. **Mapear para o commit correto**
   - Usar `git log` para encontrar qual commit modificou o arquivo
   - Usar `git blame` para identificar a linha específica
   - Verificar o histórico de commits relacionados

3. **Criar relatório de rastreamento**
   - Listar todos os erros encontrados
   - Identificar qual commit causou cada erro
   - Status: pendente/resolvido

---

## 🔍 Processo de Identificação

### Exemplo de como vou identificar:

**Quando você me passar um erro como:**
```
Error: Cannot find module '@/lib/modules/customer-modules'
at /src/app/dashboard/page.tsx:15
```

**Eu vou:**
1. Identificar o arquivo: `src/app/dashboard/page.tsx`
2. Identificar a linha: 15
3. Verificar qual commit modificou esse arquivo:
   ```bash
   git log --oneline -- src/app/dashboard/page.tsx
   ```
4. Verificar o histórico de importações:
   ```bash
   git blame src/app/dashboard/page.tsx -L 15,15
   ```
5. Mapear para o commit correspondente (ex: `41ef21e` - commit 010)

---

## 📋 Formato de Relatório

Vou criar um relatório assim:

| # | Erro | Arquivo | Linha | Commit | Hash | Status |
|---|------|---------|-------|--------|------|--------|
| 1 | Cannot find module | dashboard/page.tsx | 15 | 010 | 41ef21e | ⚠️ Pendente |
| 2 | Type error | module-badge.tsx | 23 | 008 | 80beac2 | ✅ Resolvido |

---

## ✅ O que consigo identificar:

- ✅ **Erros de import** (module not found)
  - Identificar qual commit criou/modificou o import
  - Verificar se o arquivo importado foi criado no mesmo commit ou anterior

- ✅ **Erros de sintaxe** (TypeScript, JavaScript)
  - Identificar qual commit introduziu o código com erro
  - Verificar o histórico de mudanças

- ✅ **Erros de tipo** (TypeScript)
  - Identificar qual commit modificou os tipos
  - Verificar a definição de tipos no commit

- ✅ **Erros de runtime** (execução)
  - Identificar qual commit introduziu o código problemático
  - Analisar o stack trace

- ✅ **Erros de build** (compilação)
  - Identificar qual commit quebrou o build
  - Verificar dependências e imports

---

## 🔧 Ferramentas que vou usar:

### 1. Git Log (encontrar commit do arquivo)
```bash
git log --oneline --all -- <arquivo>
```

### 2. Git Blame (encontrar commit da linha)
```bash
git blame <arquivo> -L <linha>,<linha>
```

### 3. Git Show (ver alterações do commit)
```bash
git show <hash-do-commit> -- <arquivo>
```

### 4. Git Diff (comparar versões)
```bash
git diff <commit-anterior> <commit-atual> -- <arquivo>
```

---

## 📝 Exemplo de Análise

### Erro da Vercel:
```
Error: Module not found: Can't resolve '@/lib/modules/customer-modules'
at ./src/app/dashboard/page.tsx:15
```

### Processo de Identificação:

**1. Identificar o arquivo com erro:**
- Arquivo: `src/app/dashboard/page.tsx`
- Linha: 15

**2. Verificar quando esse arquivo foi modificado:**
```bash
git log --oneline -- src/app/dashboard/page.tsx
```
Resultado: `41ef21e feat(010): Fase 4 - Adicionar badges de módulos no Dashboard`

**3. Verificar o que foi importado nessa linha:**
```bash
git show 41ef21e:src/app/dashboard/page.tsx | sed -n '15p'
```
Resultado: `import { getCustomerModuleSlugs } from '@/lib/modules/customer-modules';`

**4. Verificar quando o arquivo importado foi criado:**
```bash
git log --oneline --all -- src/lib/modules/customer-modules.ts
```
Resultado: `ff3a75d feat(003): Fase 2 - Criar server actions para gerenciamento de módulos`

**5. Identificar o problema:**
- Commit 010 tentou usar um arquivo criado no commit 003
- Se o erro é "module not found", pode ser que:
  - O arquivo não foi criado corretamente no commit 003
  - O import está incorreto no commit 010
  - O path alias não está configurado

**6. Mapeamento:**
- **Erro:** Module not found `@/lib/modules/customer-modules`
- **Arquivo com erro:** `src/app/dashboard/page.tsx` linha 15
- **Commit que causou o erro:** `41ef21e` (010)
- **Commit que deveria ter criado o arquivo:** `ff3a75d` (003)

---

## 📊 Template de Relatório

Quando você me passar os erros, vou criar um relatório assim:

```markdown
## 🔍 Análise de Erros de Deploy

### Erro #1
**Mensagem:** [mensagem do erro]
**Arquivo:** [arquivo]
**Linha:** [linha]
**Commit identificado:** [número do commit] - [hash]
**Status:** ⚠️ Pendente / ✅ Resolvido
**Solução proposta:** [como corrigir]

### Erro #2
...
```

---

## ✅ Confirmação

**Sim, consigo identificar o commit do erro apenas com o log que você me passar!**

**O que preciso:**
- ✅ Log completo do erro da Vercel
- ✅ Mensagem de erro (completa)
- ✅ Stack trace (se disponível)
- ✅ Arquivo e linha (se disponível)

**O que vou fornecer:**
- ✅ Identificação do commit que causou o erro
- ✅ Hash do commit
- ✅ Número do commit (001, 003, etc.)
- ✅ Análise do problema
- ✅ Proposta de solução
- ✅ Controle de quais erros foram resolvidos

---

**Aguardando os logs de erro da Vercel!** 🎯

**Quando você receber os erros, cole aqui e eu vou:**
1. Analisar cada erro
2. Identificar o commit correspondente
3. Criar um relatório completo
4. Sugerir correções


