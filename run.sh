#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "========================================================"
echo "  🍃 Gerenciador de Aplicativos Linux Mint (Clone Web) "
echo "========================================================"

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🧪 Executando testes de integridade..."
npm test

echo "🚀 Iniciando servidor do Gerenciador de Aplicativos..."
echo "Acesse a aplicação em: http://localhost:3000"
echo "Pressione Ctrl+C para encerrar."
echo "========================================================"

npm run dev -- --host 0.0.0.0 --port 3000
