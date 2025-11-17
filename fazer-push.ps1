# Script para fazer push das alterações para o GitHub
# Execute este arquivo com um duplo clique ou clique com botão direito > Executar com PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fazendo Push para o GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se há alterações para fazer push
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Há alterações não commitadas!" -ForegroundColor Yellow
    Write-Host "Por favor, faça commit primeiro." -ForegroundColor Yellow
    pause
    exit
}

# Verifica se há commits para fazer push
$commits = git log origin/main..HEAD --oneline 2>$null
if (-not $commits) {
    Write-Host "ℹ️  Não há commits novos para fazer push." -ForegroundColor Blue
    pause
    exit
}

Write-Host "📦 Commits que serão enviados:" -ForegroundColor Green
git log origin/main..HEAD --oneline
Write-Host ""

# Tenta fazer push
Write-Host "🚀 Tentando fazer push..." -ForegroundColor Yellow
$result = git push origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCESSO! Alterações enviadas para o GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Você pode verificar em: https://github.com/ctoutbank/portal-outbank" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push. Possíveis causas:" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Você precisa autenticar no GitHub" -ForegroundColor Yellow
    Write-Host "2. Você não tem permissão para fazer push neste repositório" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 SOLUÇÕES SIMPLES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OPÇÃO 1 - Usar GitHub Desktop (MAIS FÁCIL):" -ForegroundColor Green
    Write-Host "  1. Baixe e instale: https://desktop.github.com/" -ForegroundColor White
    Write-Host "  2. Abra o GitHub Desktop" -ForegroundColor White
    Write-Host "  3. Faça login com sua conta do GitHub" -ForegroundColor White
    Write-Host "  4. Abra este repositório no GitHub Desktop" -ForegroundColor White
    Write-Host "  5. Clique em 'Push origin' no botão azul" -ForegroundColor White
    Write-Host ""
    Write-Host "OPÇÃO 2 - Usar Token de Acesso:" -ForegroundColor Green
    Write-Host "  1. Acesse: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "  2. Clique em 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "  3. Dê um nome (ex: 'portal-outbank')" -ForegroundColor White
    Write-Host "  4. Marque a opção 'repo' (todas as permissões de repositório)" -ForegroundColor White
    Write-Host "  5. Clique em 'Generate token'" -ForegroundColor White
    Write-Host "  6. COPIE o token (você não verá ele novamente!)" -ForegroundColor White
    Write-Host "  7. Execute este comando no PowerShell:" -ForegroundColor White
    Write-Host "     git push https://SEU_TOKEN@github.com/ctoutbank/portal-outbank.git main" -ForegroundColor Yellow
    Write-Host "     (Substitua SEU_TOKEN pelo token que você copiou)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPÇÃO 3 - Pedir ajuda para alguém com acesso ao repositório" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

