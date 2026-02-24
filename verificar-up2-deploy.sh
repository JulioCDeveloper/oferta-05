#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  🔍 VERIFICAÇÃO COMPLETA UP2 PARA DEPLOY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar arquivos CSS
echo "📁 1. Arquivos CSS:"
css_count=$(ls up2/css/*.css 2>/dev/null | wc -l)
echo "   Total: $css_count arquivos"

# 2. Verificar arquivos JS
echo ""
echo "📁 2. Arquivos JS:"
js_count=$(ls up2/*.js 2>/dev/null | wc -l)
echo "   Total: $js_count arquivos"

# 3. Verificar arquivos com @
echo ""
echo "❌ 3. Arquivos com @ (deve ser 0):"
at_count=$(find up2 -name "*@*" -type f \( -name "*.css" -o -name "*.js" \) | wc -l)
if [ $at_count -eq 0 ]; then
  echo -e "   ${GREEN}✅ 0 arquivos com @${NC}"
else
  echo -e "   ${RED}❌ $at_count arquivos com @${NC}"
  find up2 -name "*@*" -type f \( -name "*.css" -o -name "*.js" \)
fi

# 4. Verificar HTML
echo ""
echo "📝 4. Referências no HTML:"
css_refs=$(grep -o 'href="css/[^"]*\.css"' up2/index.html | wc -l)
js_refs=$(grep -o 'src="[^"]*\.js"' up2/index.html | wc -l)
echo "   CSS: $css_refs referências"
echo "   JS: $js_refs referências"

# 5. Verificar vercel.json
echo ""
echo "⚙️  5. Configuração Vercel:"
if grep -q "/up2/css/" vercel.json; then
  echo -e "   ${GREEN}✅ Rota /up2/css/ configurada${NC}"
else
  echo -e "   ${RED}❌ Rota /up2/css/ NÃO configurada${NC}"
fi

if grep -q "/up2/js/" vercel.json; then
  echo -e "   ${GREEN}✅ Rota /up2/js/ configurada${NC}"
else
  echo -e "   ${RED}❌ Rota /up2/js/ NÃO configurada${NC}"
fi

# 6. Verificar git
echo ""
echo "📦 6. Status Git:"
git add -A 2>/dev/null
changed=$(git status --short | wc -l)
if [ $changed -eq 0 ]; then
  echo -e "   ${YELLOW}⚠️  Nenhuma mudança detectada${NC}"
  echo "   Isso pode significar que já foi commitado"
else
  echo -e "   ${GREEN}✅ $changed arquivos modificados${NC}"
fi

# 7. Listar alguns arquivos CSS para confirmar
echo ""
echo "📋 7. Amostra de arquivos CSS (primeiros 5):"
ls up2/css/*.css 2>/dev/null | head -5 | while read file; do
  basename "$file"
done

# 8. Verificar se arquivos específicos existem
echo ""
echo "🎯 8. Verificando arquivos críticos:"
critical_files=(
  "up2/css/frontend.min42e3.css"
  "up2/css/style.minb12b.css"
  "up2/css/theme.minb12b.css"
  "up2/jquery.minf43b.js"
  "up2/frontend.min42e3.js"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    size=$(du -h "$file" | cut -f1)
    echo -e "   ${GREEN}✅${NC} $(basename "$file") ($size)"
  else
    echo -e "   ${RED}❌${NC} $(basename "$file") - FALTANDO"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  📊 RESUMO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $at_count -eq 0 ] && [ $css_count -gt 20 ] && [ $js_count -gt 10 ]; then
  echo -e "${GREEN}✅ UP2 está pronto para deploy!${NC}"
  echo ""
  echo "Comandos para deploy:"
  echo "  git add ."
  echo "  git commit -m \"fix: atualizar arquivos CSS/JS do up2\""
  echo "  git push"
else
  echo -e "${RED}❌ UP2 tem problemas que precisam ser corrigidos${NC}"
  echo ""
  echo "Problemas encontrados:"
  [ $at_count -gt 0 ] && echo "  - Arquivos com @ no nome"
  [ $css_count -lt 20 ] && echo "  - Poucos arquivos CSS ($css_count)"
  [ $js_count -lt 10 ] && echo "  - Poucos arquivos JS ($js_count)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
