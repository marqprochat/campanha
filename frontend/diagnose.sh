#!/bin/sh

# Script de diagnóstico para Easypanel/Docker
echo "🔍 Iniciando diagnóstico de rede..."

# 1. Verificar DNS padrão
echo "📋 /etc/resolv.conf:"
cat /etc/resolv.conf

# 2. Verificar hosts locais
echo "📋 /etc/hosts:"
cat /etc/hosts

# 3. Testar resolução de nomes comuns
echo "🔄 Testando resolução de DNS..."

TARGETS="backend campanha-backend apps_campanha-backend campanha-backend.apps campanha-backend.apps.svc.cluster.local redis apps_redis postgres apps_postgres"

for target in $TARGETS; do
    echo "----------------------------------------"
    echo "Tentando resolver: $target"
    nslookup $target
    
    if ping -c 1 -W 1 $target >/dev/null 2>&1; then
        echo "✅ PING SUCESSO: $target"
    else
        echo "❌ PING FALHOU: $target"
    fi
done

echo "----------------------------------------"
echo "Diagnóstico concluído."
