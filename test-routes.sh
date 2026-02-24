#!/bin/bash

# Script para testar as rotas UP1, UP2, UP3, UP4

echo "🧪 Testando rotas das páginas UP..."
echo ""

PORT=${1:-8080}
BASE_URL="http://localhost:$PORT"

echo "📍 Servidor: $BASE_URL"
echo ""

# Função para testar uma rota
test_route() {
    local route=$1
    local name=$2
    
    echo -n "Testando $name ($route)... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ OK (200)"
    elif [ "$response" = "000" ]; then
        echo "❌ ERRO - Servidor não está rodando"
    else
        echo "❌ ERRO ($response)"
    fi
}

# Testar rotas
echo "=== UP1 - CNH Social ==="
test_route "/up1/" "Página inicial"
test_route "/up1/index.html" "index.html"
test_route "/up1/consulta.html" "consulta.html"
echo ""

echo "=== UP2 - Taxa de Emissão ==="
test_route "/up2/" "Página inicial"
test_route "/up2/index.html" "index.html"
echo ""

echo "=== UP3 - Prova Técnica ==="
test_route "/up3/" "Página inicial"
test_route "/up3/index.html" "index.html"
echo ""

echo "=== UP4 - Exame Psicotécnico ==="
test_route "/up4/" "Página inicial"
test_route "/up4/index.html" "index.html"
echo ""

echo "=== Outras Rotas ==="
test_route "/" "Página principal"
test_route "/login/" "Login"
echo ""

echo "✨ Teste concluído!"
echo ""
echo "💡 Dica: Se o servidor não estiver rodando, execute:"
echo "   node index0server.js"
echo ""
echo "   Ou com PM2:"
echo "   pm2 start index0server.js"
