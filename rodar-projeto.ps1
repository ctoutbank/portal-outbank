# Script para rodar o projeto localmente
# Execute este arquivo com um duplo clique ou clique com botão direito > Executar com PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rodando Projeto Localmente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verifica se tem yarn.lock
    if (Test-Path "yarn.lock") {
        Write-Host "Usando Yarn..." -ForegroundColor Gray
        yarn install
    } else {
        Write-Host "Usando NPM..." -ForegroundColor Gray
        npm install
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        Write-Host "Tente executar manualmente: npm install" -ForegroundColor Yellow
        pause
        exit
    }
    
    Write-Host ""
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
    Write-Host ""
}

# Verifica se tem .env
if (-not (Test-Path ".env") -and -not (Test-Path ".env.local")) {
    Write-Host "⚠️  AVISO: Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "O projeto pode precisar de variáveis de ambiente configuradas." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  O servidor vai abrir em:" -ForegroundColor White
Write-Host "  http://localhost:3000" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Dica: Após o servidor iniciar, abra seu navegador" -ForegroundColor Gray
Write-Host "   e acesse: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Para parar o servidor, pressione: Ctrl + C" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Tenta usar yarn primeiro, depois npm
if (Test-Path "yarn.lock") {
    yarn dev
} else {
    npm run dev
}

