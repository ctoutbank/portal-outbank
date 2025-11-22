# Como Atribuir Super Admin ao cto@outbank.com.br

## Opção 1: Via API (Recomendado quando servidor estiver rodando)

### Passo 1: Iniciar o servidor
```bash
npm run dev
```

### Passo 2: Executar a requisição

**Via curl:**
```bash
curl -X POST http://localhost:3000/api/admin/assign-super-admin -H "Content-Type: application/json" -d "{\"email\":\"cto@outbank.com.br\"}"
```

**Via PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/assign-super-admin" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"cto@outbank.com.br"}' | Select-Object -ExpandProperty Content
```

**Via navegador/Postman:**
- URL: `POST http://localhost:3000/api/admin/assign-super-admin`
- Headers: `Content-Type: application/json`
- Body: `{"email":"cto@outbank.com.br"}`

## Opção 2: Via SQL (Mais direto)

Execute o script SQL `scripts/assign-super-admin.sql` diretamente no seu banco de dados:

1. Abra o Neon Console ou seu cliente PostgreSQL
2. Execute o conteúdo do arquivo `scripts/assign-super-admin.sql`
3. O script vai:
   - Buscar o perfil SUPER_ADMIN (ou ADMIN se não existir)
   - Buscar o usuário cto@outbank.com.br
   - Atualizar o perfil do usuário
   - Mostrar o resultado

## Opção 3: Via Vercel (Produção)

Se o código já estiver no Vercel:

```bash
curl -X POST https://portal-outbank.vercel.app/api/admin/assign-super-admin -H "Content-Type: application/json" -d "{\"email\":\"cto@outbank.com.br\"}"
```

---

**Nota:** Certifique-se de que existe um perfil com "SUPER" ou "ADMIN" no nome no banco de dados antes de executar.




