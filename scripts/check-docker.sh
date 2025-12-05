#!/bin/bash

# Script para verificar se o Docker está rodando

echo "🔍 Verificando status do Docker..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    echo "📥 Instale o Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if docker info &> /dev/null; then
    echo "✅ Docker está rodando"
    echo "🚀 Iniciando serviços..."
    docker compose up -d
else
    echo "❌ Docker daemon não está rodando"
    echo ""
    echo "Por favor:"
    echo "1. Abra o Docker Desktop"
    echo "2. Aguarde até que o ícone fique verde na barra de menus"
    echo "3. Execute novamente: docker compose up -d"
    exit 1
fi

