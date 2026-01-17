---
description: Comando para blindar estruturas críticas do código
---

# Blindagem de Estruturas Críticas

Quando o usuário disser **"blindar"**, **"proteger"**, ou **"bloquear"** uma estrutura:

## Passos obrigatórios:

1. **Identificar** a estrutura a ser blindada (arquivo, função, regra)
2. **Documentar** em `.agent/SHIELDS.md`:
   - Nome da estrutura
   - Data de blindagem
   - Motivo/regra que deve ser protegida
   - Script de verificação (se aplicável)
3. **Criar script de verificação** em `scripts/` se não existir
4. **Confirmar** com o usuário que a blindagem foi registrada

## Antes de alterar estrutura blindada:

**OBRIGATÓRIO** antes de modificar qualquer item listado em `.agent/SHIELDS.md`:

1. ⚠️ **PARAR** e informar o usuário:
   > "Esta estrutura está blindada: [nome]. Motivo: [motivo].  
   > A alteração proposta é: [descrição].  
   > Deseja aprovar esta alteração?"

2. **Aguardar aprovação explícita** do usuário
3. Se aprovado, **atualizar o histórico** em `SHIELDS.md`

## Verificação periódica:

```bash
./scripts/check-shields.sh
```

Este script verifica se todas as regras de blindagem estão sendo respeitadas.
