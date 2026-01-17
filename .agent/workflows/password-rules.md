---
description: Regras críticas de performance para senhas - evitar bcrypt
---

# Regras de Senhas - IMPORTANTE

## ⚠️ NUNCA usar bcrypt para senhas

Este projeto usa **scrypt** (~5ms) ao invés de **bcrypt** (~1-3s) para hashing de senhas.

### Funções corretas:
```typescript
// Para criar hash de nova senha:
import { hashPassword } from '@/app/utils/password';
const hash = hashPassword(password);

// Para verificar senha:
import { verifyPassword } from '@/lib/auth';
const isValid = await verifyPassword(password, hashedPassword);
```

### Nunca usar:
- `bcrypt.hash()`
- `bcrypt.compare()` (exceto em `lib/auth.ts` para compatibilidade legada)

### Verificação:
```bash
./scripts/check-bcrypt-usage.sh
```
