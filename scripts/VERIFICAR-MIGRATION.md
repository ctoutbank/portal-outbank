# Como Verificar se a Migration Precisa ser Executada em Outros Ambientes

## 📋 Resumo

Baseado na configuração do projeto, você **provavelmente não precisa executar em outro lugar**, mas aqui está como verificar:

---

## ✅ Cenário 1: Você Executou no Neon (Banco de Produção)

Se o Neon que você usou é o mesmo banco usado pelo Vercel em produção, **você já está pronto!** ✅

**Como confirmar:**
1. Acesse o [Vercel Dashboard](https://vercel.com)
2. Vá em **Settings** > **Environment Variables**
3. Procure por `POSTGRES_URL`, `DATABASE_URL` ou `NEON_DATABASE_URL`
4. Verifique se a URL aponta para o mesmo banco Neon onde você executou a migration

Se a URL for do mesmo projeto Neon → **✅ Já está feito!**

---

## 🔍 Cenário 2: Desenvolvimento Local

Se você roda o projeto localmente e usa um banco separado:

### Como verificar:
1. Verifique se existe arquivo `.env.local` na raiz do projeto
2. Veja se há uma `POSTGRES_URL` ou `DATABASE_URL` diferente
3. Se a URL apontar para um banco diferente do Neon de produção → **Precisa executar também**

### Se precisar executar localmente:
```bash
# Conecte ao banco local e execute a migration:
psql "sua-connection-string-local" -f drizzle/migrations/0003_add_restrict_customer_data_to_profiles.sql
```

---

## 🌍 Cenário 3: Ambientes Separados (Staging, Dev)

Se você tem ambientes separados no Vercel:

### Como verificar:
1. No Vercel Dashboard, verifique se há **Preview Environments** ou **Staging**
2. Cada ambiente pode ter suas próprias variáveis de ambiente
3. Se houver ambientes separados com bancos diferentes → **Precisa executar em cada um**

---

## ✅ Verificação Rápida

Execute esta query no banco onde você executou a migration:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default,
    table_name
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'restrict_customer_data';
```

**Se retornar um resultado** → Migration executada com sucesso ✅

---

## 🎯 Resposta Direta

**Na maioria dos casos (Neon + Vercel):**
- ✅ Se você executou no Neon e o Vercel usa o mesmo Neon → **Já está pronto!**
- ⚠️ Se você roda localmente com banco separado → **Precisa executar localmente também**
- ⚠️ Se você tem staging/dev separados → **Precisa executar em cada ambiente**

---

## 💡 Dica: Verificar Variáveis de Ambiente no Vercel

1. Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
2. Procure por:
   - `POSTGRES_URL`
   - `DATABASE_URL`  
   - `NEON_DATABASE_URL`
3. Compare a URL com a do Neon onde você executou a migration
4. Se for a mesma → ✅ Está tudo certo!

---

## 📝 Checklist

- [ ] Migration executada no Neon (produção)
- [ ] Verificado se Vercel usa o mesmo Neon
- [ ] (Se aplicável) Migration executada localmente
- [ ] (Se aplicável) Migration executada em staging/dev





