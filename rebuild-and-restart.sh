#!/bin/bash

# Script para reconstruir e reiniciar os containers

echo "🔨 Parando containers..."
docker compose down

echo "🗑️  Removendo imagem antiga do backend..."
docker rmi astra_backend -f 2>/dev/null || true

echo "🏗️  Reconstruindo containers..."
docker compose up --build -d

echo "⏳ Aguardando backend iniciar..."
sleep 15

echo "📋 Verificando logs do backend..."
docker logs astra_backend --tail 50

echo "✅ Done! Aplicação iniciada."
echo ""
echo "Para monitorar os logs em tempo real:"
echo "  docker logs astra_backend -f"
echo ""
echo "Para verificar se está rodando:"
echo "  docker ps | grep astra"
