#!/bin/bash

# Script para configurar e iniciar o banco de dados

echo "🔍 Verificando Docker..."

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon não está rodando"
    echo "Por favor, inicie o Docker Desktop e tente novamente"
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

echo "🚀 Iniciando serviços (PostgreSQL, Redis, MinIO)..."
docker compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

echo ""
echo "🔍 Verificando status dos serviços..."
docker compose ps

echo ""
echo "📊 Verificando conexão com PostgreSQL..."
if docker exec agent_api_postgres pg_isready -U postgres &> /dev/null; then
    echo "✅ PostgreSQL está pronto!"
    echo ""
    echo "📝 Você pode agora executar as migrações:"
    echo "   pnpm run migration:run"
    echo "   ou"
    echo "   npm run migration:run"
else
    echo "⏳ PostgreSQL ainda está iniciando..."
    echo "Aguarde alguns segundos e tente novamente"
fi

