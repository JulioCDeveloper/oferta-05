# ✅ Correção - Redirecionamento UP1

## 🔍 Problema Identificado

No `/up1`, após 5 segundos, o site redirecionava para `/consulta.html` em vez de `/up1/consulta.html`.

## 🐛 Causa Raiz

O JavaScript no `up1/index.html` usava caminho relativo:

```javascript
window.location.href = 'consulta.html';
```

Quando acessado via `/up1`, o navegador interpretava como `/consulta.html` (raiz do domínio) em vez de `/up1/consulta.html`.

## ✅ Solução Aplicada

Alterado para caminho absoluto:

```javascript
window.location.href = '/up1/consulta.html';
```

## 📁 Arquivo Modificado

- `up1/index.html` (linha do setTimeout)

## 🚀 Deploy

```bash
git add up1/index.html
git commit -m "fix: corrigir redirecionamento up1 para /up1/consulta.html"
git push
```

## ✅ Teste

1. Acessar: https://www.socialpdffdigital.sbs/up1
2. Aguardar 5 segundos
3. Deve redirecionar para: https://www.socialpdffdigital.sbs/up1/consulta.html

## 📊 Status

- ✅ up1/index.html - Corrigido
- ✅ up3/index.html - OK (redirecionamento externo)
- ✅ up4/index.html - OK (sem redirecionamento)

**Data:** 23/02/2026  
**Status:** ✅ CORRIGIDO
