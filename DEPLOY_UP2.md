# 🚀 Deploy da Correção do UP2

## ✅ O que foi corrigido

1. **Caminhos de CSS/JS** - Convertido %40 para @ em todos os links
2. **Links de fontes** - Substituído por links diretos do Google Fonts
3. **Configuração Vercel** - Adicionadas rotas específicas para up2

## 📋 Comandos para Deploy

```bash
# 1. Adicionar todos os arquivos
git add .

# 2. Fazer commit
git commit -m "fix: corrigir CSS/JS e fontes no up2"

# 3. Fazer push (deploy automático na Vercel)
git push
```

## 🔍 Como Verificar se Funcionou

1. **Aguardar deploy** (1-2 minutos)
2. **Acessar:** https://www.socialpdffdigital.sbs/up2
3. **Abrir DevTools** (F12) → Aba Network
4. **Verificar:**
   - Arquivos CSS carregando (status 200)
   - Arquivos JS carregando (status 200)
   - Fontes do Google carregando
   - Página com layout completo

## 📁 Arquivos Modificados

- ✅ up2/index.html
- ✅ up2/index-3.html
- ✅ vercel.json
- ✅ Scripts de correção criados

## 🛠️ Scripts Disponíveis

Se precisar rodar novamente:

```bash
# Correção completa (recomendado)
node fix-up2-complete.js

# Apenas caminhos
node fix-all-up2-paths.js

# Apenas fontes
node fix-up2-fonts.js
```

## ❓ Se Não Funcionar

1. **Limpar cache da Vercel:**
   - Dashboard → Deployments → ... → Redeploy
   - Marcar "Clear build cache"

2. **Verificar logs:**
   - Dashboard → Deployments → Ver logs

3. **Testar localmente:**
   ```bash
   npx serve .
   # Acessar: http://localhost:3000/up2
   ```

## 📞 Documentação Completa

Ver arquivo: `SOLUCAO_UP2_CSS.md`
