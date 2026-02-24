#!/bin/bash

echo "🔍 Verificando configuração de CORS..."
echo ""

echo "1️⃣ Verificando se brpdfonline.site está no middlea.js:"
grep -n "brpdfonline.site" middlea.js
echo ""

echo "2️⃣ Verificando se oferta-05.vercel.app está no middlea.js:"
grep -n "oferta-05.vercel.app" middlea.js
echo ""

echo "3️⃣ Verificando se isProductionOrigin usa productionOrigins:"
grep -A 3 "const isProductionOrigin" middlea.js
echo ""

echo "4️⃣ Status do servidor PM2:"
pm2 list | grep index0server
echo ""

echo "5️⃣ Última reinicialização:"
pm2 describe index0server | grep "restart time"
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Se as origens aparecem acima, execute: pm2 restart index0server"
echo "   2. Aguarde 5 segundos"
echo "   3. Teste: node test-proxy.js"
