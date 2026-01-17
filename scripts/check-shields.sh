#!/bin/bash
# Script para verificar integridade de todas as estruturas blindadas
# Execute: ./scripts/check-shields.sh

echo "🛡️ Verificando estruturas blindadas..."
echo ""

ERRORS=0

# ============================================
# Shield 1: Sistema de Senhas
# ============================================
echo "📋 [1/1] Sistema de Senhas (Performance do Login)"

# Verificar bcrypt.hash
BCRYPT_HASH=$(grep -rn "bcrypt.hash\|bcrypt\.hash" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "password.ts" | grep -v "NÃO USE" | grep -v "SHIELDS.md")

if [ -n "$BCRYPT_HASH" ]; then
    echo "   ❌ VIOLAÇÃO: Uso de bcrypt.hash encontrado:"
    echo "$BCRYPT_HASH"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ bcrypt.hash: OK"
fi

# Verificar bcrypt.compare fora de lib/auth.ts
BCRYPT_COMPARE=$(grep -rn "bcrypt.compare\|bcrypt\.compare" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "lib/auth.ts" | grep -v "password.ts" | grep -v "SHIELDS.md")

if [ -n "$BCRYPT_COMPARE" ]; then
    echo "   ❌ VIOLAÇÃO: Uso de bcrypt.compare fora de lib/auth.ts:"
    echo "$BCRYPT_COMPARE"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ bcrypt.compare: OK"
fi

# Verificar se password.ts ainda usa scrypt
if grep -q "scryptSync" src/app/utils/password.ts 2>/dev/null; then
    echo "   ✅ password.ts usa scrypt: OK"
else
    echo "   ❌ VIOLAÇÃO: password.ts não está usando scrypt!"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# Resultado final
# ============================================
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Todas as estruturas blindadas estão íntegras!"
    exit 0
else
    echo "⚠️  ALERTA: $ERRORS violação(ões) encontrada(s)!"
    echo "   Consulte .agent/SHIELDS.md para entender as regras."
    exit 1
fi
