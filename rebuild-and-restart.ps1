# Script para reconstruir e reiniciar os containers no Windows

Write-Host "🔨 Parando containers..." -ForegroundColor Yellow
docker compose down

Write-Host "🗑️  Removendo imagem antiga do backend..." -ForegroundColor Yellow
docker rmi astra_backend -f 2>$null

Write-Host "🏗️  Reconstruindo containers..." -ForegroundColor Yellow
docker compose up --build -d

Write-Host "⏳ Aguardando backend iniciar (15 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "📋 Verificando logs do backend..." -ForegroundColor Cyan
docker logs astra_backend --tail 50

Write-Host "✅ Done! Aplicação iniciada." -ForegroundColor Green
Write-Host ""
Write-Host "Para monitorar os logs em tempo real:" -ForegroundColor Gray
Write-Host "  docker logs astra_backend -f"
Write-Host ""
Write-Host "Para verificar se está rodando:" -ForegroundColor Gray
Write-Host "  docker ps | findstr astra"
