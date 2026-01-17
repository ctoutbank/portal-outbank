# 🛡️ Estruturas Blindadas - Portal Outbank

Este arquivo registra todas as estruturas críticas que **NÃO DEVEM SER ALTERADAS** sem aprovação explícita do usuário.

## Como funciona

1. Quando o usuário diz "blindar X", adiciona-se uma entrada aqui
2. Antes de alterar qualquer arquivo/função blindada, a IA DEVE:
   - Informar o usuário que a estrutura é blindada
   - Explicar por que a alteração é necessária
   - Aguardar aprovação explícita
3. Execute `./scripts/check-shields.sh` para verificar integridade

---

## 🔒 Estruturas Blindadas

### 1. Sistema de Senhas (Performance do Login)
**Data**: 2026-01-17
**Motivo**: Login deve permanecer rápido (~50-100ms)

| Componente | Regra | Verificação |
|------------|-------|-------------|
| `src/app/utils/password.ts` | Usar scrypt APENAS | `check-bcrypt-usage.sh` |
| `src/lib/auth.ts:verifyPassword` | Suportar bcrypt+scrypt | - |
| `src/lib/auth.ts:hashPassword` | Delegar para scrypt | - |

**Proibido**:
- Usar `bcrypt.hash()` em qualquer lugar
- Usar `bcrypt.compare()` fora de `lib/auth.ts`

**Script de verificação**: `./scripts/check-bcrypt-usage.sh`

---

## Histórico de Alterações

| Data | Estrutura | Ação | Aprovado por |
|------|-----------|------|--------------|
| 2026-01-17 | Sistema de Senhas | Blindado | Usuário |
