# Checklist de Diagnóstico - Problemas com Emails

## 🔍 Verificações no Resend

### 1. Verificar API Key
- [ ] Acesse https://resend.com/api-keys
- [ ] Verifique se existe uma API Key ativa
- [ ] Copie a API Key e verifique se está configurada no Vercel como `RESEND_API_KEY`
- [ ] A API Key deve ter permissão para enviar emails

### 2. Verificar Domínio
- [ ] Acesse https://resend.com/domains
- [ ] Verifique se o domínio `consolle.one` está adicionado
- [ ] Verifique o status do domínio:
  - ✅ **Verificado** (green checkmark) = OK
  - ⚠️ **Pendente** = Precisa configurar DNS
  - ❌ **Falhou** = Problema com DNS
- [ ] Se não estiver verificado, adicione os registros DNS:
  - **SPF**: `v=spf1 include:_spf.resend.com ~all`
  - **DKIM**: Registros fornecidos pelo Resend
  - **DMARC**: `v=DMARC1; p=none; rua=mailto:dmarc@consolle.one`

### 3. Verificar Logs no Resend
- [ ] Acesse https://resend.com/emails
- [ ] Verifique se há tentativas de envio
- [ ] Verifique o status dos emails:
  - ✅ **Delivered** = Email entregue
  - ⚠️ **Bounced** = Email rejeitado
  - ❌ **Failed** = Erro no envio
  - 🔄 **Pending** = Aguardando envio
- [ ] Clique em um email para ver detalhes do erro (se houver)

### 4. Verificar Rate Limits
- [ ] Verifique se não excedeu o limite de envios
- [ ] Plano gratuito: 3.000 emails/mês
- [ ] Se excedeu, upgrade o plano ou aguarde reset mensal

---

## 🗄️ Verificações no Neon (Banco de Dados)

### 1. Verificar se as Colunas Foram Criadas
Execute esta query no SQL Editor do Neon:

```sql
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_customization' 
  AND column_name IN ('email_image_url', 'email_image_file_id')
ORDER BY column_name;
```

**Resultado esperado:**
```
email_image_file_id | bigint | null | YES
email_image_url     | varchar | 100 | YES
```

### 2. Verificar Dados Existentes
Execute esta query para ver se há dados:

```sql
SELECT 
    id,
    customer_id,
    email_image_url,
    email_image_file_id,
    image_url,
    slug
FROM customer_customization
WHERE customer_id IS NOT NULL
LIMIT 10;
```

### 3. Verificar se Há Valores NULL
Execute esta query para ver quantos registros têm email_image_url NULL:

```sql
SELECT 
    COUNT(*) as total,
    COUNT(email_image_url) as com_email_image,
    COUNT(*) - COUNT(email_image_url) as sem_email_image
FROM customer_customization
WHERE customer_id IS NOT NULL;
```

### 4. Testar Query de Busca
Execute esta query simulando o que o código faz:

```sql
SELECT 
    cc.id,
    cc.slug,
    cc.email_image_url,
    cc.image_url,
    f.file_url,
    c.name
FROM customer_customization cc
LEFT JOIN file f ON f.id = cc.file_id
LEFT JOIN customers c ON c.id = cc.customer_id
WHERE cc.customer_id = 1  -- Substitua por um ID real
LIMIT 1;
```

---

## ⚙️ Verificações no Vercel

### 1. Variáveis de Ambiente
- [ ] Acesse https://vercel.com/[seu-projeto]/settings/environment-variables
- [ ] Verifique se `RESEND_API_KEY` está configurada:
  - ✅ Deve estar em **Production**, **Preview** e **Development**
  - ✅ Valor deve começar com `re_`
- [ ] Verifique se `EMAIL_FROM` está configurada (opcional):
  - ✅ Padrão: `noreply@consolle.one`
  - ✅ Pode ser: `Nome <noreply@consolle.one>`

### 2. Logs de Deploy
- [ ] Acesse https://vercel.com/[seu-projeto]/deployments
- [ ] Clique no último deploy
- [ ] Verifique se há erros de build
- [ ] Procure por mensagens relacionadas a `RESEND_API_KEY`

### 3. Logs de Runtime
- [ ] Acesse https://vercel.com/[seu-projeto]/logs
- [ ] Filtre por `[sendWelcomePasswordEmail]` ou `[InsertUser]`
- [ ] Procure por erros:
  - ❌ `RESEND_API_KEY is not set`
  - ❌ `Email inválido`
  - ❌ `Failed to send email`
  - ❌ Códigos de erro do Resend (4xx, 5xx)

---

## 🧪 Teste Manual

### 1. Criar um Usuário de Teste
1. Acesse a plataforma administrativa
2. Vá para um ISO existente
3. Crie um novo usuário com um email válido que você controla
4. Verifique os logs no Vercel em tempo real

### 2. Verificar Logs em Tempo Real
Execute este comando no terminal (se tiver acesso):

```bash
vercel logs [seu-projeto] --follow
```

Ou acesse: https://vercel.com/[seu-projeto]/logs

Procure por:
- `[InsertUser] 🔐` - Logs de senha
- `[InsertUser] 📧` - Logs de email
- `[sendWelcomePasswordEmail] 📧` - Logs de envio
- `❌ ERRO CRÍTICO` - Erros

### 3. Verificar Email Recebido
- [ ] Verifique a caixa de entrada
- [ ] Verifique a pasta de spam/lixo eletrônico
- [ ] Verifique se o remetente é `noreply@consolle.one`
- [ ] Verifique se o assunto está correto

---

## 🔧 Correções Comuns

### Problema: "RESEND_API_KEY is not set"
**Solução:**
1. Adicione a variável no Vercel
2. Faça um novo deploy
3. Ou reinicie as funções serverless

### Problema: "Domain not verified"
**Solução:**
1. Adicione os registros DNS no provedor do domínio
2. Aguarde propagação (pode levar até 48h)
3. Verifique no Resend se o status mudou para "Verified"

### Problema: "Email bounced"
**Solução:**
1. Verifique se o email de destino existe
2. Verifique se não está em lista negra
3. Verifique logs do Resend para detalhes

### Problema: "Rate limit exceeded"
**Solução:**
1. Upgrade do plano no Resend
2. Ou aguarde reset mensal
3. Implemente rate limiting no código

---

## 📊 Query SQL para Diagnóstico Completo

Execute esta query para ver o estado completo:

```sql
-- Diagnóstico completo de customização e emails
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.slug as customer_slug,
    cc.id as customization_id,
    cc.slug as customization_slug,
    cc.email_image_url,
    cc.email_image_file_id,
    cc.image_url,
    cc.file_id,
    f.file_url,
    CASE 
        WHEN cc.email_image_url IS NOT NULL THEN 'Tem email_image_url'
        WHEN cc.image_url IS NOT NULL THEN 'Tem apenas image_url'
        WHEN f.file_url IS NOT NULL THEN 'Tem apenas file_url'
        ELSE 'Sem logo'
    END as logo_status
FROM customers c
LEFT JOIN customer_customization cc ON cc.customer_id = c.id
LEFT JOIN file f ON f.id = cc.file_id
WHERE c.id IS NOT NULL
ORDER BY c.id
LIMIT 20;
```

---

## 🆘 Se Nada Funcionar

1. **Capture os logs completos** do Vercel durante a criação de um usuário
2. **Capture os logs do Resend** (dashboard de emails)
3. **Execute as queries SQL** acima e salve os resultados
4. **Documente o erro exato** que aparece
5. **Verifique se o problema é específico de um tenant** ou geral

---

## 📝 Informações para Análise

Quando solicitar ajuda, forneça:

1. ✅ Status do domínio no Resend (verificado/pendente)
2. ✅ Status dos últimos 5 emails no Resend (delivered/bounced/failed)
3. ✅ Resultado da query SQL de verificação de colunas
4. ✅ Logs do Vercel durante criação de usuário
5. ✅ Mensagem de erro exata (se houver)
6. ✅ Variáveis de ambiente configuradas no Vercel (sem mostrar valores)

