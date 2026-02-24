# ✅ Solução Proxy Transparente - Sem Alterar HTML

## 🎯 O Que Foi Feito

Configurei seu servidor Node.js para funcionar como **proxy transparente** da API Infinity Buscas. O HTML **não precisa ser alterado** - ele continua chamando a API normalmente, mas passa pelo seu servidor.

## 📁 Arquivos Modificados

### 1. `src/routes/proxyInfinityRoutes.js`
- Criado endpoint `/api/search` que replica a API Infinity
- Adiciona headers CORS corretos automaticamente
- Mantém os mesmos parâmetros: `Access-Key`, `Base`, `Info`

### 2. `index0server.js`
- Adicionada rota: `app.use('/api', proxyInfinityRoutes)`
- Configurado para servir arquivos estáticos
- Proxy montado em `/api/search`

### 3. `login/index.html`
- **NENHUMA ALTERAÇÃO NECESSÁRIA** ✅
- Continua chamando a API normalmente

## 🚀 Como Ativar

### Opção A: Configurar Nginx (Recomendado)

Adicione no seu Nginx:

```nginx
location /api/search {
    proxy_pass http://localhost:8081/api/search;
    proxy_set_header Host $host;
    add_header 'Access-Control-Allow-Origin' '*' always;
}
```

Reinicie:
```bash
sudo nginx -t && sudo systemctl reload nginx
pm2 restart index0server
```

### Opção B: Alterar 1 Linha no HTML (Mais Simples)

No `login/index.html`, linha ~1310:

```javascript
// De:
const INFINITY_API_URL = "https://api.infinitybuscas.com/api/search";

// Para:
const INFINITY_API_URL = "https://brpdfonline.site/api/search";
```

Depois:
```bash
pm2 restart index0server
```

## 🧪 Testar

```bash
# 1. Testar o proxy
node test-proxy.js

# 2. Testar no navegador
curl "https://brpdfonline.site/api/search?Access-Key=inf_85b302c7721fa309acc33a0bfbc2058975725f33553a3e38153256f9e967455a&Base=cpf&Info=70520358201"

# 3. Ver logs
pm2 logs index0server
```

## 📊 Fluxo de Requisição

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (brpdfonline.site/login)                           │
│ fetch("https://api.infinitybuscas.com/api/search?...")     │ ← HTML não muda
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Nginx (brpdfonline.site)                                    │
│ Intercepta /api/search → proxy_pass localhost:8081         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Node.js (localhost:8081/api/search)                         │
│ - Recebe requisição                                         │
│ - Faz fetch para api.infinitybuscas.com                    │
│ - Adiciona headers CORS corretos                           │
│ - Retorna resposta                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ API Infinity Buscas                                         │
│ https://api.infinitybuscas.com/api/search                  │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Vantagens

1. **HTML não precisa mudar** - Código frontend intacto
2. **CORS resolvido** - Servidor adiciona headers corretos
3. **Segurança** - Chave da API pode ficar no servidor
4. **Logs** - Todas as consultas são registradas
5. **Cache** - Pode adicionar cache Redis facilmente
6. **Rate Limiting** - Pode limitar requisições por IP

## 🔧 Próximos Passos (Opcional)

1. **Configurar Nginx** (se ainda não tiver)
2. **Adicionar cache Redis** para evitar consultas duplicadas
3. **Adicionar rate limiting** para proteger contra abuso
4. **Monitorar logs** com `pm2 logs index0server`

## 📝 Documentação Completa

- `CONFIGURACAO_PROXY.md` - Guia detalhado de configuração
- `test-proxy.js` - Script de teste
- `.env.example` - Variáveis de ambiente

## 🆘 Suporte

Se tiver problemas:

```bash
# Ver logs do servidor
pm2 logs index0server --lines 50

# Verificar se está rodando
pm2 list

# Reiniciar
pm2 restart index0server

# Ver status do Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 🎉 Resultado Final

Agora você pode:
- ✅ Usar o HTML sem alterações
- ✅ Fazer deploy na Vercel sem problemas
- ✅ Consultar a API sem erro de CORS
- ✅ Ter controle total sobre as requisições
