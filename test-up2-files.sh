#!/bin/bash
# Script para testar se todos os arquivos CSS/JS do up2 existem

echo "🔍 Testando arquivos do up2..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

total=0
found=0
missing=0

# Testar arquivos CSS
echo "📁 Testando arquivos CSS..."
for file in up2/css/*.css; do
  if [ -f "$file" ] && [ -s "$file" ]; then
    echo -e "${GREEN}✅${NC} $(basename "$file") ($(du -h "$file" | cut -f1))"
    ((found++))
  else
    echo -e "${RED}❌${NC} $(basename "$file") - FALTANDO OU VAZIO"
    ((missing++))
  fi
  ((total++))
done

echo ""
echo "📁 Testando arquivos JS na raiz..."
# Testar arquivos JS principais
js_files=(
  "jquery.minf43b.js@ver=3.7.1"
  "jquery-migrate.min5589.js@ver=3.4.1"
  "frontend.min42e3.js@ver=3.26.0"
  "frontend.min57a7.js@ver=3.24.4"
  "frontend-modules.min42e3.js@ver=3.26.0"
  "hello-frontend.minb12b.js@ver=3.1.1"
  "webpack.runtime.min42e3.js@ver=3.26.0"
  "elements-handlers.min57a7.js@ver=3.24.4"
)

for file in "${js_files[@]}"; do
  filepath="up2/$file"
  if [ -f "$filepath" ] && [ -s "$filepath" ]; then
    echo -e "${GREEN}✅${NC} $file ($(du -h "$filepath" | cut -f1))"
    ((found++))
  else
    echo -e "${RED}❌${NC} $file - FALTANDO OU VAZIO"
    ((missing++))
  fi
  ((total++))
done

echo ""
echo "📁 Testando arquivos JS na pasta js/..."
for file in up2/js/*.js; do
  if [ -f "$file" ] && [ -s "$file" ]; then
    echo -e "${GREEN}✅${NC} $(basename "$file") ($(du -h "$file" | cut -f1))"
    ((found++))
  else
    echo -e "${RED}❌${NC} $(basename "$file") - FALTANDO OU VAZIO"
    ((missing++))
  fi
  ((total++))
done

echo ""
echo "═══════════════════════════════════════"
echo "📊 RESUMO:"
echo "   Total: $total arquivos"
echo -e "   ${GREEN}Encontrados: $found${NC}"
if [ $missing -gt 0 ]; then
  echo -e "   ${RED}Faltando: $missing${NC}"
else
  echo "   Faltando: 0"
fi
echo "═══════════════════════════════════════"

if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✅ Todos os arquivos estão OK!${NC}"
  exit 0
else
  echo -e "${RED}❌ Alguns arquivos estão faltando!${NC}"
  exit 1
fi
