#!/bin/bash
# Script para verificar se bcrypt.hash está sendo usado indevidamente
# Execute: ./scripts/check-bcrypt-usage.sh

echo "🔍 Verificando uso de bcrypt.hash no código..."
echo ""

# Buscar usos de bcrypt.hash (exceto em node_modules e documentação)
RESULTS=$(grep -rn "bcrypt.hash\|bcrypt\.hash" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "password.ts" | grep -v "NÃO USE")

if [ -z "$RESULTS" ]; then
    echo "✅ Nenhum uso de bcrypt.hash encontrado. Login permanecerá rápido!"
else
    echo "⚠️  ALERTA: Encontrado uso de bcrypt.hash (causa lentidão no login):"
    echo ""
    echo "$RESULTS"
    echo ""
    echo "📌 Substitua por: import { hashPassword } from '@/app/utils/password'"
    exit 1
fi

echo ""
echo "🔍 Verificando uso de bcrypt.compare fora de lib/auth.ts..."

# Buscar usos de bcrypt.compare (exceto em lib/auth.ts que é permitido)
COMPARE_RESULTS=$(grep -rn "bcrypt.compare\|bcrypt\.compare" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "lib/auth.ts" | grep -v "password.ts")

if [ -z "$COMPARE_RESULTS" ]; then
    echo "✅ Nenhum uso indevido de bcrypt.compare encontrado."
else
    echo "⚠️  ALERTA: Encontrado uso de bcrypt.compare fora de lib/auth.ts:"
    echo ""
    echo "$COMPARE_RESULTS"
    echo ""
    echo "📌 Substitua por: import { verifyPassword } from '@/lib/auth'"
    exit 1
fi

echo ""
echo "🎉 Tudo certo! O login permanecerá rápido."
