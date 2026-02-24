# Configuração do Proxy Transparente - API Infinity Buscas

## 🎯 Objetivo

Permitir que o frontend chame a API Infinity Buscas **diretamente** (sem alterar o código HTML), mas passando pelo seu servidor como proxy para resolver o problema de CORS.

## 🔧 Como Funciona

### Antes (com erro de CORS)
```
Frontend (brpdfonline.site)
    ↓
https://api.infinitybuscas.com/api/search?...
    ↓
❌ CORS Error: Origin 'brpdfonline.site' não permitido
```

### Agora (sem erro)
```
Frontend (brpdfonline.site)
    ↓
https://brpdfonline.site/api/search?...  ← Proxy transparente
    ↓
https://api.infinitybuscas.com/api/search?...
    ↓
✅ Resposta com CORS correto
```

## 📝 Configuração

### 1. O HTML não precisa ser alterado!

O código continua assim:
```javascript
const INFINITY_API_URL = "https://api.infinitybuscas.com/api/search";
fetch(`${INFINITY_API_URL}?Access-Key=...&Base=cpf&Info=...`)
```

### 2. Configure o DNS/Proxy Reverso

Você precisa configurar seu servidor para que:

**Opção A: Nginx (Recomendado)**

Adicione no seu Nginx (`/etc/nginx/sites-available/brpdfonline.site`):

```nginx
server {
    listen 443 ssl http2;
    server_name brpdfonline.site www.brpdfonline.site;

    # Certificado SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Proxy para API Infinity (intercepta /api/search)
    location /api/search {
        proxy_pass http://localhost:8081/api/search;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }

    # Servir arquivos estáticos (HTML, CSS, JS)
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Depois reinicie o Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Opção B: Alterar o HTML (mais simples)**

Se não quiser mexer no Nginx, altere apenas uma linha no HTML:

```javascript
// De:
const INFINITY_API_URL = "https://api.infinitybuscas.com/api/search";

// Para:
const INFINITY_API_URL = "https://brpdfonline.site/api/search";
```

### 3. Reinicie o Servidor Node.js

```bash
pm2 restart index0server
```

## 🧪 Testar

### Teste 1: Proxy funcionando
```bash
curl "https://brpdfonline.site/api/search?Access-Key=inf_85b302c7721fa309acc33a0bfbc2058975725f33553a3e38153256f9e967455a&Base=cpf&Info=70520358201"
```

Deve retornar os dados do CPF.

### Teste 2: Frontend
Acesse `https://brpdfonline.site/login` e tente fazer login com um CPF.

## 📊 Logs

Para ver os logs do proxy:
```bash
pm2 logs index0server --lines 100
```

Você verá mensagens como:
```
[Proxy Infinity] Consultando: Base=cpf, Info=70520358201
```

## ⚙️ Configurações Avançadas

### Cache de Consultas (Opcional)

Para evitar consultas duplicadas, você pode adicionar cache Redis no proxy:

```javascript
// Em src/routes/proxyInfinityRoutes.js
const redis = require('redis');
const client = redis.createClient();

router.get('/search', async (req, res) => {
  const cacheKey = `infinity:${req.query.Base}:${req.query.Info}`;
  
  // Verificar cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Consultar API...
  const data = await fetch(...);
  
  // Salvar no cache (5 minutos)
  await client.setEx(cacheKey, 300, JSON.stringify(data));
  
  return res.json(data);
});
```

### Rate Limiting (Opcional)

Para limitar requisições por IP:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requisições
});

app.use('/api/search', limiter);
```

## 🔍 Troubleshooting

### Erro: "Cannot GET /api/search"
- Verifique se o servidor foi reiniciado: `pm2 restart index0server`
- Verifique os logs: `pm2 logs index0server`

### Ainda aparece erro de CORS
- Verifique se o Nginx está configurado corretamente
- Ou altere o HTML para usar `https://brpdfonline.site/api/search`

### Consulta demora muito
- A API Infinity pode estar lenta
- Considere adicionar cache Redis

## 📚 Referências

- [Express.js Proxy](https://expressjs.com/en/guide/routing.html)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Nginx Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
