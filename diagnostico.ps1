# Script de Diagnóstico - Verificar Permissões e Configuração

Write-Host "🔍 DIAGNÓSTICO DO SISTEMA ASTRA CAMPAIGN" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Docker está rodando
Write-Host "1️⃣  Verificando Docker..." -ForegroundColor Yellow
$dockerCheck = docker ps 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} else {
    Write-Host "❌ Docker NÃO está rodando ou acessível" -ForegroundColor Red
    exit 1
}

# 2. Listar containers
Write-Host ""
Write-Host "2️⃣  Containers em execução:" -ForegroundColor Yellow
docker ps | Select-Object -Skip 1 | ForEach-Object {
    $line = $_
    if ($line -match "astra") {
        Write-Host "  ✅ $line" -ForegroundColor Green
    }
}

# 3. Verificar backend
Write-Host ""
Write-Host "3️⃣  Status do Backend:" -ForegroundColor Yellow
$backendStatus = docker ps --filter "name=astra_backend" --format "{{.State}}" 2>$null
if ($backendStatus -eq "running") {
    Write-Host "  ✅ Backend está RUNNING" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Backend status: $backendStatus" -ForegroundColor Yellow
}

# 4. Verificar banco de dados
Write-Host ""
Write-Host "4️⃣  Status do Banco de Dados:" -ForegroundColor Yellow
$postgresStatus = docker ps --filter "name=astra_shared_postgres" --format "{{.State}}" 2>$null
if ($postgresStatus -eq "running") {
    Write-Host "  ✅ PostgreSQL está RUNNING" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  PostgreSQL status: $postgresStatus" -ForegroundColor Yellow
}

# 5. Verificar Redis
Write-Host ""
Write-Host "5️⃣  Status do Redis:" -ForegroundColor Yellow
$redisStatus = docker ps --filter "name=astra_shared_redis" --format "{{.State}}" 2>$null
if ($redisStatus -eq "running") {
    Write-Host "  ✅ Redis está RUNNING" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Redis status: $redisStatus" -ForegroundColor Yellow
}

# 6. Verificar permissões do diretório /app/uploads
Write-Host ""
Write-Host "6️⃣  Verificando permissões de diretórios no Backend:" -ForegroundColor Yellow
$permCheck = docker exec astra_backend ls -la /app/uploads 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Diretório /app/uploads existe e é acessível" -ForegroundColor Green
} else {
    Write-Host "  ❌ Erro ao acessar /app/uploads" -ForegroundColor Red
}

# 7. Verificar últimos erros no log
Write-Host ""
Write-Host "7️⃣  Últimos 20 linhas do log do Backend:" -ForegroundColor Yellow
Write-Host "---" -ForegroundColor DarkGray
docker logs astra_backend --tail 20 2>$null | ForEach-Object {
    if ($_ -match "❌|Error|error") {
        Write-Host "  $_" -ForegroundColor Red
    } elseif ($_ -match "✅") {
        Write-Host "  $_" -ForegroundColor Green
    } elseif ($_ -match "⚠️|warn") {
        Write-Host "  $_" -ForegroundColor Yellow
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}
Write-Host "---" -ForegroundColor DarkGray

# 8. Teste de saúde do backend
Write-Host ""
Write-Host "8️⃣  Testando endpoint de saúde do Backend:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Backend respondendo (HTTP 200)" -ForegroundColor Green
        Write-Host "  Resposta: $($response.Content)"
    }
} catch {
    Write-Host "  ⚠️  Backend não respondendo em http://localhost:3001" -ForegroundColor Yellow
    Write-Host "  Pode estar iniciando ainda..." -ForegroundColor Gray
}

# 9. Teste de saúde do banco
Write-Host ""
Write-Host "9️⃣  Testando conexão com PostgreSQL:" -ForegroundColor Yellow
$dbCheck = docker exec astra_shared_postgres pg_isready -U postgres 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ PostgreSQL está acessível" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Erro ao conectar ao PostgreSQL" -ForegroundColor Yellow
}

# 10. Espaço em disco
Write-Host ""
Write-Host "🔟 Espaço em disco do Backend:" -ForegroundColor Yellow
$diskSpace = docker exec astra_backend df -h /app/uploads 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ /app/uploads tem espaço disponível" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Erro ao verificar espaço em disco" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Diagnóstico concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Se houver erros, execute:" -ForegroundColor Yellow
Write-Host "  .\rebuild-and-restart.ps1" -ForegroundColor Cyan
Write-Host ""
