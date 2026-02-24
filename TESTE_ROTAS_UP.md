# Teste das Rotas UP1, UP2, UP3, UP4

## Problema Identificado
As páginas up1, up2, up3 e up4 não estavam funcionando porque faltavam rotas no `vercel.json`.

## Solução Aplicada

### 1. Atualizado `vercel.json`
Adicionadas rotas para todas as pastas up1-up4:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/login/(.*)",
      "dest": "/login/$1"
    },
    {
      "src": "/login",
      "dest": "/login/index.html"
    },
    {
      "src": "/up1/consulta.html",
      "dest": "/up1/consulta.html"
    },
    {
      "src": "/up1/(.*)",
      "dest": "/up1/$1"
    },
    {
      "src": "/up1",
      "dest": "/up1/index.html"
    },
    {
      "src": "/up2/(.*)",
      "dest": "/up2/$1"
    },
    {
      "src": "/up2",
      "dest": "/up2/index.html"
    },
    {
      "src": "/up3/(.*)",
      "dest": "/up3/$1"
    },
    {
      "src": "/up3",
      "dest": "/up3/index.html"
    },
    {
      "src": "/up4/(.*)",
      "dest": "/up4/$1"
    },
    {
      "src": "/up4",
      "dest": "/up4/index.html"
    },
    {
      "src": "/",
      "dest": "/index.html"
    }
  ]
}
```

### 2. Servidor Express
O servidor já estava configurado corretamente para servir arquivos estáticos:

```javascript
app.use(express.static('.', {
  setHeaders: (res, path) => {
    res.header('Access-Control-Allow-Origin', '*');
  }
}));
```

## Como Testar

### 1. Reiniciar o Servidor
```bash
# Se estiver usando PM2
pm2 restart index0server

# Ou se estiver rodando diretamente
node index0server.js
```

### 2. Testar as Rotas

#### UP1 (CNH Social - 2 páginas)
- **Página inicial**: http://localhost:8080/up1/
- **Página de consulta**: http://localhost:8080/up1/consulta.html

A página inicial redireciona automaticamente para `consulta.html` após 5 segundos.

#### UP2 (Taxa de Emissão)
- **Página**: http://localhost:8080/up2/

#### UP3 (Prova Técnica de Direção)
- **Página**: http://localhost:8080/up3/

#### UP4 (Exame Psicotécnico)
- **Página**: http://localhost:8080/up4/

### 3. Verificar Logs
```bash
# Ver logs do servidor
pm2 logs index0server

# Ou se estiver rodando diretamente, verificar o console
```

## Estrutura das Páginas

### UP1 - CNH Social
- `up1/index.html` - Tela de loading com redirecionamento automático
- `up1/consulta.html` - Formulário de consulta e pagamento

### UP2 - Taxa de Emissão
- `up2/index.html` - Página completa com validação e pagamento

### UP3 - Prova Técnica
- `up3/index.html` - Agendamento de prova com formulário

### UP4 - Exame Psicotécnico
- `up4/index.html` - Informações e agendamento do exame

## Verificação de Funcionamento

Todas as páginas devem:
1. ✅ Carregar corretamente
2. ✅ Exibir conteúdo HTML
3. ✅ Carregar estilos CSS inline
4. ✅ Executar JavaScript
5. ✅ Redirecionar para links de pagamento quando aplicável

## Troubleshooting

### Erro 404
Se ainda receber erro 404:
1. Verifique se o servidor foi reiniciado
2. Confirme que os arquivos existem nas pastas corretas
3. Verifique permissões de leitura dos arquivos

### Erro 500
Se receber erro 500:
1. Verifique os logs do servidor
2. Confirme que não há erros de sintaxe nos arquivos HTML
3. Verifique se o middleware `express.static` está ativo

### Redirecionamento não funciona
Se o redirecionamento automático do UP1 não funcionar:
1. Verifique se o JavaScript está habilitado no navegador
2. Abra o console do navegador para ver erros
3. Confirme que o arquivo `consulta.html` existe

## Notas Importantes

- O `vercel.json` é usado pelo Vercel para configurar rotas em produção
- Em desenvolvimento local, o Express serve os arquivos diretamente
- As rotas são case-sensitive (maiúsculas/minúsculas importam)
- Arquivos estáticos são servidos da raiz do projeto (`.`)
