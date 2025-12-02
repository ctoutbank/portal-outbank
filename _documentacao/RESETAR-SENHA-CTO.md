# Como Resetar a Senha do cto@outbank.com.br

## Problema
O usuário `cto@outbank.com.br` não consegue fazer login com a senha `Outb@nkiso`.

## Soluções Disponíveis

### Opção 1: Via API Route (Recomendado)

1. **Acesse o console do Clerk** ou use um usuário Super Admin já logado
2. **Faça uma requisição POST** para a API:

```bash
# Via curl
curl -X POST https://portal-outbank.vercel.app/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=SEU_TOKEN_AQUI" \
  -d '{
    "email": "cto@outbank.com.br",
    "newPassword": "Outb@nkiso2025!"
  }'
```

```powershell
# Via PowerShell
$body = @{
    email = "cto@outbank.com.br"
    newPassword = "Outb@nkiso2025!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://portal-outbank.vercel.app/api/admin/reset-password" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Cookie" = "__session=SEU_TOKEN_AQUI"
  } `
  -Body $body
```

**Nota**: Você precisa estar autenticado como Super Admin para usar esta API.

### Opção 2: Via Clerk Dashboard

1. Acesse https://dashboard.clerk.com
2. Vá em **Users** > Busque por `cto@outbank.com.br`
3. Clique no usuário
4. Vá em **Security** > **Reset Password**
5. Defina uma nova senha (diferente do email)
6. A senha deve ter no mínimo 8 caracteres

### Opção 3: Via Interface do Portal

1. Acesse `/config/users` (como Super Admin)
2. Encontre o usuário `cto@outbank.com.br`
3. Clique em **Editar**
4. No campo **"Alterar Senha"**, digite a nova senha
5. Clique em **Atualizar**

## Requisitos da Senha

- Mínimo de 8 caracteres
- Não pode ser igual ao email
- Não pode ser uma senha comprometida (pwned)
- Recomendado: usar letras maiúsculas, minúsculas, números e símbolos

## Exemplo de Senha Segura

```
Outb@nkiso2025!
```

Esta senha atende todos os requisitos:
- ✅ 15 caracteres
- ✅ Letras maiúsculas e minúsculas
- ✅ Números
- ✅ Símbolos (@ e !)
- ✅ Diferente do email

## Verificação

Após resetar a senha, tente fazer login:
1. Acesse a página de login
2. Use o email: `cto@outbank.com.br`
3. Use a nova senha definida
4. Se ainda não funcionar, verifique os logs do servidor

## Troubleshooting

### Erro: "A senha não pode ser igual ao email"
- Solução: Use uma senha diferente do email

### Erro: "Esta senha foi comprometida"
- Solução: Use uma senha mais complexa e única

### Erro: "Acesso negado"
- Solução: Você precisa ser Super Admin para resetar senhas

### Erro: "Usuário não encontrado"
- Solução: Verifique se o email está correto no Clerk Dashboard




