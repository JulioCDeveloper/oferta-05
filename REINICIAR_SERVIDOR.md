# 🔄 Como Reiniciar o Servidor

## ✅ Mudanças Aplicadas

Adicionei `https://brpdfonline.site` e `https://oferta-05.vercel.app` na lista de origens permitidas no CORS.

## 🚀 Reiniciar o Servidor

```bash
# Opção 1: Reiniciar com PM2 (recomendado)
pm2 restart index0server

# Opção 2: Reiniciar todos os processos PM2
pm2 restart all

# Opção 3: Parar e iniciar novamente
pm2 stop index0server
pm2 start index0server.js

# Verificar se está rodando
pm2 list

# Ver logs em tempo real
pm2 logs index0server
```

## 🧪 Testar

Após reiniciar, teste a consulta:

```bash
# Teste 1: Verificar se o servidor está respondendo
curl https://brpdfonline.site/api/search?Access-Key=inf_85b302c7721fa309acc33a0bfbc2058975725f33553a3e38153256f9e967455a&Base=cpf&Info=70520358201

# Teste 2: Verificar headers CORS
curl -I -H "Origin: https://brpdfonline.site" https://brpdfonline.site/api/search

# Teste 3: Usar o script de teste
node test-proxy.js
```

## 📋 Verificar Logs

```bash
# Ver últimas 50 linhas
pm2 logs index0server --lines 50

# Ver logs em tempo real
pm2 logs index0server --raw

# Ver apenas erros
pm2 logs index0server --err
```

## ✅ O Que Deve Aparecer nos Logs

Após reiniciar, você deve ver:

```
✅ Middlewares de segurança carregados
✅ Proxy Infinity Buscas configurado em /api/search
Servidor rodando na porta 8081
```

E quando fizer uma consulta:

```
[Proxy Infinity] Consultando: Base=cpf, Info=70520358201
```

## ❌ Se Ainda Aparecer Erro de CORS

1. **Verifique se o arquivo foi salvo:**
   ```bash
   grep -n "brpdfonline.site" middlea.js
   ```
   Deve mostrar a linha onde está configurado.

2. **Verifique se o servidor realmente reiniciou:**
   ```bash
   pm2 describe index0server
   ```
   Veja o campo "restart time" - deve ser recente.

3. **Limpe o cache do navegador:**
   - Chrome/Edge: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Ou use modo anônimo

4. **Verifique se o Nginx está cacheando:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🔍 Debug Avançado

Se ainda tiver problemas:

```bash
# Ver todas as variáveis de ambiente
pm2 env 0

# Ver configuração completa
pm2 show index0server

# Reiniciar com logs detalhados
pm2 restart index0server --update-env
pm2 logs index0server --lines 100
```

## 📞 Suporte

Se o erro persistir, envie os logs:

```bash
pm2 logs index0server --lines 100 > logs.txt
```

E verifique:
1. ✅ Arquivo `middlea.js` tem `brpdfonline.site`
2. ✅ Servidor foi reiniciado (veja "restart time")
3. ✅ Nginx não está cacheando
4. ✅ Cache do navegador foi limpo
