# Integração Checkout PIX com API Overmax

## 📋 Resumo

Todas as páginas UP1, UP2, UP3 e UP4 agora redirecionam para páginas de checkout locais que se integram com a API `api-v2.overmax.io` para gerar pagamentos PIX em tempo real com monitoramento via WebSocket.

## ✅ Mudanças Realizadas

### 1. Páginas de Checkout Criadas

Foram criadas 4 páginas de checkout idênticas ao design fornecido:

- `up1/checkout.html` - Exame Médico CNH (R$ 150,00)
- `up2/checkout.html` - Taxa de Inscrição (R$ 42,58)
- `up3/checkout.html` - Prova Técnica de Direção (R$ 89,90)
- `up4/checkout.html` - Exame Psicotécnico (R$ 120,00)

### 2. Links Modificados

#### UP1 - CNH Social
**Arquivo**: `up1/consulta.html`
- **Antes**: `https://pay.pag-onblz.shop/5pjw3RnW7lv32lQ`
- **Depois**: `/up1/checkout.html`

#### UP2 - Taxa de Emissão
**Arquivo**: `up2/index.html`
- **Antes**: `https://pay.pay-centralmap.shop/521rZJzE9W4ZeaX`
- **Depois**: `/up2/checkout.html`

#### UP3 - Prova Técnica
**Arquivo**: `up3/index.html`
- **Antes**: `https://pay.pag-sjak.shop/1VOvGV4dRAv3D62`
- **Depois**: `/up3/checkout.html`

#### UP4 - Exame Psicotécnico
**Arquivo**: `up4/index.html`
- **Antes**: `https://pay.pag-simlap.shop/P5LNZ8zldldgaRy`
- **Depois**: `/up4/checkout.html`

### 3. Rotas Adicionadas no Vercel

Arquivo `vercel.json` atualizado com rotas para as páginas de checkout:

```json
{
  "src": "/up1/checkout.html",
  "dest": "/up1/checkout.html"
},
{
  "src": "/up2/checkout.html",
  "dest": "/up2/checkout.html"
},
{
  "src": "/up3/checkout.html",
  "dest": "/up3/checkout.html"
},
{
  "src": "/up4/checkout.html",
  "dest": "/up4/checkout.html"
}
```

## 🎨 Design do Checkout

O checkout foi desenvolvido para ser idêntico ao print fornecido:

### Layout
- Grid responsivo de 2 colunas (formulário + carrinho)
- Design limpo e moderno
- Totalmente responsivo para mobile

### Componentes

1. **Formulário de Identificação**
   - E-mail
   - Telefone (com máscara)
   - Nome completo
   - CPF/CNPJ (com máscara)

2. **Método de Pagamento**
   - Card do PIX com ícone
   - Informações sobre pagamento instantâneo

3. **Carrinho**
   - Badge com quantidade de itens
   - Imagem do produto
   - Título e descrição
   - Subtotal e Total
   - Badge de "Ambiente seguro"

4. **Modal PIX**
   - QR Code gerado pela API
   - Código PIX para copiar
   - Botão de copiar código
   - Status de pagamento em tempo real
   - Animação de sucesso quando pago

## 🔌 Integração com API

### Endpoint de Criação de Transação

```javascript
POST https://api-v2.overmax.io/api/transactions/create

Body:
{
  "cpf": "00000000000",
  "amount": 42.58,
  "paymentMethod": "pix",
  "paymentType": "taxa_inscricao",
  "customer": {
    "name": "Nome do Cliente",
    "email": "email@example.com",
    "phone": "11999999999"
  },
  "utm_source": "cnh_social",
  "utm_medium": "web",
  "utm_campaign": "taxa_inscricao"
}
```

### Resposta da API

```javascript
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "paymentData": {
      "qrCode": "00020126580014br.gov.bcb.pix...",
      "qrCodeBase64": "data:image/png;base64,iVBORw0KGgo...",
      "expiresAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### WebSocket para Monitoramento

```javascript
// Conectar ao WebSocket
const ws = new WebSocket('wss://api-v2.overmax.io/ws');

// Inscrever-se para receber atualizações
ws.send(JSON.stringify({
  type: 'subscribe_transaction',
  payload: { transactionId: 'uuid' }
}));

// Receber atualizações de status
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'transaction_status' || data.type === 'transaction_updated') {
    const status = data.data.status; // 'pending', 'paid', 'approved'
    
    if (status === 'paid' || status === 'approved') {
      // Pagamento confirmado!
      showSuccess();
    }
  }
};
```

## 📊 Valores por Página

| Página | Produto | Valor | Payment Type |
|--------|---------|-------|--------------|
| UP1 | Exame Médico CNH | R$ 150,00 | `exame_medico_cnh` |
| UP2 | Taxa de Inscrição | R$ 42,58 | `taxa_inscricao` |
| UP3 | Prova Técnica | R$ 89,90 | `prova_tecnica_direcao` |
| UP4 | Exame Psicotécnico | R$ 120,00 | `exame_psicotecnico` |

## 🚀 Fluxo de Pagamento

1. **Usuário preenche formulário**
   - E-mail, telefone, nome e CPF
   - Validação de campos obrigatórios
   - Máscaras automáticas para telefone e CPF

2. **Clica em "GERAR PIX"**
   - Botão desabilitado durante processamento
   - Requisição POST para API Overmax
   - Criação da transação

3. **Modal PIX é exibido**
   - QR Code gerado pela API
   - Código PIX para copiar
   - Botão de copiar com feedback visual

4. **WebSocket monitora pagamento**
   - Conexão automática após gerar PIX
   - Atualização em tempo real do status
   - Mensagem "Aguardando pagamento..."

5. **Pagamento confirmado**
   - Animação de sucesso
   - Mensagem "Pagamento Confirmado!"
   - Redirecionamento automático após 3 segundos

## 🎯 Funcionalidades

### Máscaras de Input
- **Telefone**: `(00) 00000-0000`
- **CPF**: `000.000.000-00`
- **CNPJ**: `00.000.000/0000-00`

### Validações
- Campos obrigatórios
- Formato de e-mail
- Formato de telefone
- Formato de CPF/CNPJ

### Feedback Visual
- Botão desabilitado durante processamento
- Loading spinner no modal
- Animação de sucesso
- Botão de copiar com confirmação

### Responsividade
- Layout adaptável para mobile
- Grid de 2 colunas em desktop
- 1 coluna em mobile
- Modal responsivo

## 🔒 Segurança

- Conexão HTTPS com API
- WebSocket seguro (WSS)
- Validação de dados no frontend
- Badge de "Ambiente seguro"
- Timeout de conexão WebSocket

## 📱 Compatibilidade

- Chrome/Edge (últimas versões)
- Firefox (últimas versões)
- Safari (últimas versões)
- Mobile browsers (iOS/Android)

## 🧪 Como Testar

### 1. Testar Localmente

```bash
# Iniciar servidor
node index0server.js

# Acessar páginas
http://localhost:8080/up1/checkout.html
http://localhost:8080/up2/checkout.html
http://localhost:8080/up3/checkout.html
http://localhost:8080/up4/checkout.html
```

### 2. Testar Fluxo Completo

1. Acesse uma das páginas UP (ex: `/up2/`)
2. Clique no botão de pagamento
3. Preencha o formulário de checkout
4. Clique em "GERAR PIX"
5. Verifique se o QR Code é exibido
6. Copie o código PIX
7. Faça o pagamento (em ambiente de teste)
8. Verifique se o status é atualizado automaticamente

### 3. Testar WebSocket

Abra o console do navegador (F12) e verifique:

```
✅ WebSocket conectado
📨 Mensagem WebSocket: { type: 'transaction_status', data: { status: 'pending' } }
```

Quando o pagamento for confirmado:

```
📨 Mensagem WebSocket: { type: 'transaction_updated', data: { status: 'paid' } }
```

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se a API está respondendo
- Verifique o console para erros
- Confirme que todos os campos estão preenchidos

### WebSocket não conecta
- Verifique se a URL do WebSocket está correta
- Confirme que o servidor suporta WSS
- Verifique firewall/proxy

### Pagamento não é detectado
- Verifique se o WebSocket está conectado
- Confirme que o transactionId está correto
- Verifique logs do servidor

### Modal não fecha
- Clique no X no canto superior direito
- Ou recarregue a página

## 📝 Notas Importantes

1. **API Overmax**: Certifique-se de que a API está configurada e funcionando
2. **WebSocket**: O servidor deve suportar conexões WebSocket
3. **CORS**: A API deve permitir requisições do seu domínio
4. **Valores**: Os valores estão hardcoded em cada página de checkout
5. **Redirecionamento**: Após pagamento, redireciona para `/sucesso.html` (criar essa página)

## 🔄 Próximos Passos

1. **Criar página de sucesso** (`/sucesso.html`)
2. **Configurar ambiente de produção** na API Overmax
3. **Testar em produção** com pagamentos reais
4. **Adicionar analytics** (Google Analytics, Facebook Pixel)
5. **Implementar retry** em caso de falha na API
6. **Adicionar timeout** para QR Code expirado

## 📞 Suporte

Em caso de problemas com a integração:

1. Verifique os logs do console do navegador
2. Verifique os logs do servidor
3. Confirme que a API Overmax está respondendo
4. Teste a conexão WebSocket separadamente

## ✨ Resultado Final

Todas as páginas UP agora têm um checkout profissional e funcional que:
- ✅ Gera PIX em tempo real
- ✅ Monitora pagamento automaticamente
- ✅ Exibe feedback visual ao usuário
- ✅ Redireciona após confirmação
- ✅ É totalmente responsivo
- ✅ Segue o design fornecido
