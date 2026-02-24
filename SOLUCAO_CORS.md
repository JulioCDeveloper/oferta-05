# Solução para Erro de CORS - API Infinity Buscas

## Problema

A API Infinity Buscas (`https://api.infinitybuscas.com`) bloqueia requisições diretas do navegador devido à política de CORS. O erro era:

```
Access to fetch at 'https://api.infinitybuscas.com/api/search...' 
from origin 'https://oferta-05.vercel.app' has been blocked by CORS policy
```

## Solução Implementada

Criamos um **proxy no seu servidor** (`https://brpdfonline.site`) que:

1. Recebe a requisição do frontend
2. Faz a chamada à API Infinity Buscas do lado do servidor (sem CORS)
3. Retorna os dados para o frontend

### Arquivos Criados/Modificados

#### 1. `src/routes/proxyInfinityRoutes.js` (NOVO)
- Endpoint proxy: `GET /api/v1/proxy/buscar-cpf/:cpf`
- Faz a requisição à API Infinity Buscas do lado do servidor
- Retorna os dados para o cliente

#### 2. `index0server.js` (MODIFICADO)
- Adicionada rota do proxy: `app.use('/api/v1/proxy', proxyInfinityRoutes)`

#### 3. `login/index.html` (MODIFICADO)
- Alterado de: `https://api.infinitybuscas.com/api/search?...`
- Para: `https://brpdfonline.site/api/v1/proxy/buscar-cpf/{cpf}`

## Como Usar

### 1. Configurar Variável de Ambiente

Adicione no seu arquivo `.env`:

```bash
INFINITY_ACCESS_KEY=inf_85b302c7721fa309acc33a0bfbc2058975725f33553a3e38153256f9e967455a
```

### 2. Reiniciar o Servidor

```bash
# Se estiver usando PM2
pm2 restart index0server

# Ou reinicie manualmente
node index0server.js
```

### 3. Testar

Acesse seu site e tente fazer login com um CPF. A requisição agora vai:

```
Frontend (Vercel/brpdfonline.site)
    ↓
Seu Servidor (brpdfonline.site/api/v1/proxy/buscar-cpf/...)
    ↓
API Infinity Buscas (api.infinitybuscas.com)
    ↓
Seu Servidor
    ↓
Frontend
```

## Vantagens

✅ **Sem erro de CORS** - A requisição é feita do servidor, não do navegador
✅ **Segurança** - A chave da API fica no servidor, não exposta no frontend
✅ **Controle** - Você pode adicionar logs, cache, rate limiting, etc.
✅ **Compatibilidade** - Funciona em qualquer domínio (Vercel, brpdfonline.site, etc.)

## Endpoints Disponíveis

### Buscar CPF
```
GET https://brpdfonline.site/api/v1/proxy/buscar-cpf/:cpf
```

**Exemplo:**
```bash
curl https://brpdfonline.site/api/v1/proxy/buscar-cpf/70520358201
```

**Resposta:**
```json
{
  "success": true,
  "query": {
    "id": "...",
    "base": "cpf",
    "info": "70520358201"
  },
  "resultado": {
    "dados": {
      "cpf": "70520358201",
      "nome": "NOME DA PESSOA",
      "nascimento": "1990-01-01 00:00:00",
      "mae": "NOME DA MÃE",
      ...
    }
  }
}
```

## Troubleshooting

### Erro 500 no proxy
- Verifique se a variável `INFINITY_ACCESS_KEY` está configurada no `.env`
- Verifique os logs do servidor: `pm2 logs index0server`

### Ainda aparece erro de CORS
- Certifique-se de que o servidor foi reiniciado após as mudanças
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se está usando a URL correta: `https://brpdfonline.site/api/v1/proxy/buscar-cpf/...`

### CPF não encontrado
- A API retorna `success: true` mesmo quando não encontra dados
- Verifique `data.resultado.dados` para ver se há informações

## Próximos Passos (Opcional)

Você pode melhorar o proxy adicionando:

1. **Cache Redis** - Evitar consultas duplicadas
2. **Rate Limiting** - Limitar requisições por IP
3. **Logs** - Registrar todas as consultas
4. **Validação** - Validar CPF antes de consultar
5. **Fallback** - Se a API falhar, permitir cadastro manual

## Suporte

Se tiver problemas, verifique:
- Logs do servidor: `pm2 logs index0server`
- Console do navegador (F12)
- Status da API: https://api.infinitybuscas.com/status (se existir)
