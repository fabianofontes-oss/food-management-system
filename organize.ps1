# Script de organização final
Write-Host "Iniciando organização final..." -ForegroundColor Green

# 1. Deletar Sidebar órfão
Write-Host "`n1. Deletando Sidebar.tsx órfão..." -ForegroundColor Yellow
Remove-Item "src\components\dashboard\Sidebar.tsx" -Force -ErrorAction SilentlyContinue

# 2. Deletar arquivos temporários
Write-Host "2. Deletando arquivos temporários..." -ForegroundColor Yellow
Remove-Item "temp_pos_backup.txt" -Force -ErrorAction SilentlyContinue
Remove-Item "recovered_pos.txt" -Force -ErrorAction SilentlyContinue

# 3. Criar (storefront) e mover [slug]
Write-Host "3. Criando (storefront) e movendo [slug]..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src\app\(storefront)" -Force | Out-Null
Move-Item -Path "src\app\[slug]" -Destination "src\app\(storefront)\[slug]" -Force

# 4. Criar (public) e mover landing + profile
Write-Host "4. Criando (public) e movendo landing + profile..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src\app\(public)" -Force | Out-Null
Move-Item -Path "src\app\landing" -Destination "src\app\(public)\landing" -Force
Move-Item -Path "src\app\profile" -Destination "src\app\(public)\profile" -Force

Write-Host "`nOrganização concluída!" -ForegroundColor Green
