# Checklist de Diagnóstico - Erros em Usuários

Use este checklist para identificar os problemas específicos que estão ocorrendo.

## 🔍 Passo 1: Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard > Seu Projeto > Deployments > Latest
2. Abra a aba **Logs**
3. Procure por erros contendo:
   - `Error [NeonDbError]`
   - `relation "admin_customers"`
   - `Erro ao buscar ISOs autorizados`
   - `Erro ao criar usuário`
   - `Erro ao atualizar usuário`

**⚠️ IMPORTANTE:** Copie o erro **completo**, incluindo:
- Mensagem de erro
- Stack trace
- Código de erro (se houver)
- Linha do arquivo onde ocorreu

---

## 🔍 Passo 2: Verificar Console do Navegador

1. Abra a página `/config/users` no navegador
2. Pressione **F12** para abrir DevTools
3. Abra a aba **Console**
4. Tente reproduzir o problema:
   - Usar o filtro
   - Criar um novo usuário
   - Editar um usuário existente

**📋 Anote:**
- ✅ Quais erros aparecem no console?
- ✅ Qual é a mensagem de erro exata?
- ✅ Em qual ação o erro ocorre? (filtro, criação, edição)

---

## 🔍 Passo 3: Verificar Estrutura da Tabela no Banco

Execute estas queries no **Neon Console**:

### 3.1 Verificar se a tabela existe:
```sql
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_name = 'admin_customers';
```

**✅ Esperado:** Retorna 1 linha com `table_name = 'admin_customers'`

### 3.2 Verificar estrutura completa:
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;
```

**✅ Esperado:** Deve retornar:
- `id` (bigint)
- `slug` (character varying)
- `dtinsert` (timestamp)
- `dtupdate` (timestamp)
- `active` (boolean)
- `id_user` (bigint)
- `id_customer` (bigint)

### 3.3 Verificar constraints:
```sql
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'admin_customers'::regclass;
```

**✅ Esperado:** Deve ter 3 constraints:
- `admin_customers_pkey` (primary key)
- `admin_customers_id_user_fkey` (foreign key)
- `admin_customers_id_customer_fkey` (foreign key)
- `admin_customers_id_user_id_customer_key` (unique)

### 3.4 Testar query manual:
```sql
-- Ver se consegue buscar dados
SELECT * FROM admin_customers LIMIT 5;

-- Testar JOIN com customers
SELECT 
    ac.*,
    c.name AS customer_name
FROM admin_customers ac
LEFT JOIN customers c ON ac.id_customer = c.id
LIMIT 5;
```

**✅ Esperado:** Deve executar sem erro (pode retornar 0 linhas se a tabela estiver vazia)

---

## 🔍 Passo 4: Testar Cada Funcionalidade

### 4.1 Testar FILTRO:
1. Vá para `/config/users`
2. Clique no botão "Filtros"
3. Preencha um campo (ex: email)
4. Clique em "Aplicar Filtros"

**❓ O que acontece?**
- [ ] Nada acontece (página não atualiza)
- [ ] URL muda mas lista não filtra
- [ ] Erro aparece no console
- [ ] Erro aparece na tela
- [ ] Funciona normalmente ✅

**Se não funcionar, anote:**
- Erro no console?
- URL muda?
- Lista atualiza?

---

### 4.2 Testar CRIAÇÃO:
1. Vá para `/config/users`
2. Clique em "Novo Usuário"
3. Preencha o formulário:
   - Nome: Teste
   - Sobrenome: Usuario
   - Email: teste@exemplo.com
   - Senha: Teste123!
   - Perfil: Selecione um perfil
   - ISO: Selecione um ISO (se aplicável)
4. Clique em "Salvar"

**❓ O que acontece?**
- [ ] Formulário não submete (botão não funciona)
- [ ] Erro aparece antes de salvar
- [ ] Mostra "Salvando..." mas não finaliza
- [ ] Erro ao salvar no banco
- [ ] Erro ao criar no Clerk
- [ ] Usuário criado mas sem perfil/permissões
- [ ] Funciona normalmente ✅

**Se não funcionar, anote:**
- Erro no console?
- Erro na tela (toast)?
- Em qual etapa falha? (validação, Clerk, banco)

---

### 4.3 Testar EDIÇÃO:
1. Vá para `/config/users`
2. Clique no ícone de editar (lápis) de um usuário
3. Aguarde a página carregar

**❓ O que acontece?**
- [ ] Página não carrega (erro 404 ou 500)
- [ ] Página carrega mas formulário vazio
- [ ] Erro ao carregar dados do usuário
- [ ] Erro ao carregar ISOs autorizados
- [ ] Página carrega mas ao salvar dá erro
- [ ] Funciona normalmente ✅

**Se não funcionar, anote:**
- Erro no console?
- Erro na tela?
- Quais dados não carregam? (dados do usuário, ISOs, perfis)

---

## 📊 Resumo para Compartilhar

Após completar este checklist, reúna as seguintes informações:

### ✅ Informações Coletadas:

1. **Logs do Vercel:**
   ```
   [Cole aqui o erro completo do Vercel]
   ```

2. **Erros do Console:**
   ```
   [Cole aqui os erros do console do navegador]
   ```

3. **Estrutura da Tabela:**
   ```
   [Cole aqui o resultado da query de estrutura]
   ```

4. **Teste de Query Manual:**
   ```
   [Cole aqui o resultado das queries de teste]
   ```

5. **Comportamento Observado:**
   - **Filtro:** [Descreva o que acontece]
   - **Criação:** [Descreva o que acontece]
   - **Edição:** [Descreva o que acontece]

6. **Dados de Teste:**
   - Email usado para teste: `_______________`
   - ID do usuário testado: `_______________`
   - Perfil selecionado: `_______________`

---

## 🎯 Problemas Mais Comuns

### Se a tabela não existe ou estrutura está incorreta:
→ Execute a migration `0002_add_admin_customers_table.sql` no Neon Console

### Se queries manual funcionam mas código não:
→ Problema pode ser com Drizzle ORM ou importação do schema

### Se filtro não funciona mas criação/edição sim:
→ Problema específico com router/Next.js search params

### Se criação funciona mas edição não:
→ Problema ao carregar dados ou com `getAdminCustomers`

### Se tudo funciona local mas não no Vercel:
→ Problema de deployment ou variáveis de ambiente

---

## 📝 Próximos Passos

Após coletar todas as informações:

1. ✅ Compartilhe o resumo acima
2. ✅ Aguarde análise do código
3. ✅ Implementação das correções necessárias

