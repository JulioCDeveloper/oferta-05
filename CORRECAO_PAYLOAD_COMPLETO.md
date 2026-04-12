# ✅ CORREÇÃO - Payload Completo para Backend

## 🎯 Problema Identificado

O frontend estava enviando apenas campos básicos, mas o backend espera campos adicionais para processar corretamente a transação.

## 📊 Comparação

### Payload Anterior (Incompleto)
```json
{
  "external_code": "CNH_UP2_1776016585706",
  "amount": 4258,
  "customer": {
    "name": "MARCIO PAULINO MARINHO",
    "email": "selenacripto@gmail.com",
    "document": "70520358201",
    "phone": "9294514899"
  },
  "items": [{
    "code": "taxa_inscricao",
    "name": "Taxa de Inscrição CNH",
    "amount": 4258
  }]
}
```

### Payload Novo (Completo)
```json
{
  "external_code": "CNH_UP2_1776016585706",
  "payment_method": "pix",
  "payment_format": "regular",
  "installments": 1,
  "payment_amount": 4258,
  "pix": {
    "expires_in_days": 1
  },
  "items": [{
    "code": "taxa_inscricao",
    "name": "Taxa de Inscrição CNH",
    "amount": 4258,
    "total": 4258
  }],
  "customer": {
    "name": "MARCIO PAULINO MARINHO",
    "email": "selenacripto@gmail.com",
    "document": "70520358201",
    "phone": "9294514899",
    "ip": "127.0.0.1"
  },
  "extra": {
    "cybersource_fingerprint": "mangofy_integration",
    "seon_fingerprint": "pix_payment"
  }
}
```

## 🔑 Campos Adicionados

### 1. payment_method
```javascript
payment_method: 'pix'
```
- **Tipo**: String
- **Valor**: `'pix'`
- **Obrigatório**: Sim
- **Descrição**: Método de pagamento

### 2. payment_format
```javascript
payment_format: 'regular'
```
- **Tipo**: String
- **Valor**: `'regular'`
- **Obrigatório**: Sim
- **Descrição**: Formato do pagamento

### 3. installments
```javascript
installments: 1
```
- **Tipo**: Number
- **Valor**: `1`
- **Obrigatório**: Sim
- **Descrição**: Número de parcelas (PIX sempre 1)

### 4. payment_amount
```javascript
payment_amount: 4258
```
- **Tipo**: Number
- **Valor**: Valor em centavos
- **Obrigatório**: Sim
- **Descrição**: Valor total do pagamento
- **Nota**: Substituiu o campo `amount`

### 5. pix
```javascript
pix: {
  expires_in_days: 1
}
```
- **Tipo**: Object
- **Obrigatório**: Sim
- **Descrição**: Configurações do PIX
- **expires_in_days**: PIX expira em 1 dia

### 6. items[].total
```javascript
items: [{
  code: 'taxa_inscricao',
  name: 'Taxa de Inscrição CNH',
  amount: 4258,
  total: 4258  // ← Adicionado
}]
```
- **Tipo**: Number
- **Obrigatório**: Sim
- **Descrição**: Total do item (mesmo valor do amount)

### 7. customer.ip
```javascript
customer: {
  name: nome,
  email: email,
  document: cpf,
  phone: telefone,
  ip: '127.0.0.1'  // ← Adicionado
}
```
- **Tipo**: String
- **Valor**: `'127.0.0.1'` (padrão)
- **Obrigatório**: Sim
- **Descrição**: IP do cliente

### 8. extra
```javascript
extra: {
  cybersource_fingerprint: 'mangofy_integration',
  seon_fingerprint: 'pix_payment'
}
```
- **Tipo**: Object
- **Obrigatório**: Sim
- **Descrição**: Dados extras para segurança/tracking
- **cybersource_fingerprint**: Identificador Cybersource
- **seon_fingerprint**: Identificador SEON

## 📋 Estrutura Completa por Página

### UP1 - Exame Médico (R$ 150,00)
```javascript
{
  external_code: `CNH_UP1_${Date.now()}`,
  payment_method: 'pix',
  payment_format: 'regular',
  installments: 1,
  payment_amount: 15000,
  pix: { expires_in_days: 1 },
  items: [{
    code: 'exame_medico_cnh',
    name: 'Exame Médico CNH',
    amount: 15000,
    total: 15000
  }],
  customer: { name, email, document, phone, ip: '127.0.0.1' },
  extra: {
    cybersource_fingerprint: 'mangofy_integration',
    seon_fingerprint: 'pix_payment'
  }
}
```

### UP2 - Taxa de Inscrição (R$ 42,58)
```javascript
{
  external_code: `CNH_UP2_${Date.now()}`,
  payment_method: 'pix',
  payment_format: 'regular',
  installments: 1,
  payment_amount: 4258,
  pix: { expires_in_days: 1 },
  items: [{
    code: 'taxa_inscricao',
    name: 'Taxa de Inscrição CNH',
    amount: 4258,
    total: 4258
  }],
  customer: { name, email, document, phone, ip: '127.0.0.1' },
  extra: {
    cybersource_fingerprint: 'mangofy_integration',
    seon_fingerprint: 'pix_payment'
  }
}
```

### UP3 - Prova Técnica (R$ 89,90)
```javascript
{
  external_code: `CNH_UP3_${Date.now()}`,
  payment_method: 'pix',
  payment_format: 'regular',
  installments: 1,
  payment_amount: 8990,
  pix: { expires_in_days: 1 },
  items: [{
    code: 'prova_tecnica_direcao',
    name: 'Prova Técnica de Direção',
    amount: 8990,
    total: 8990
  }],
  customer: { name, email, document, phone, ip: '127.0.0.1' },
  extra: {
    cybersource_fingerprint: 'mangofy_integration',
    seon_fingerprint: 'pix_payment'
  }
}
```

### UP4 - Exame Psicotécnico (R$ 120,00)
```javascript
{
  external_code: `CNH_UP4_${Date.now()}`,
  payment_method: 'pix',
  payment_format: 'regular',
  installments: 1,
  payment_amount: 12000,
  pix: { expires_in_days: 1 },
  items: [{
    code: 'exame_psicotecnico',
    name: 'Exame Psicotécnico',
    amount: 12000,
    total: 12000
  }],
  customer: { name, email, document, phone, ip: '127.0.0.1' },
  extra: {
    cybersource_fingerprint: 'mangofy_integration',
    seon_fingerprint: 'pix_payment'
  }
}
```

## 🔄 Mapeamento Backend

O backend recebe e transforma assim:

```javascript
// Frontend envia:
{
  external_code: "CNH_UP2_1776016585706",
  payment_amount: 4258,
  // ...
}

// Backend processa:
const payload = {
  store_code: this.storeCode,  // Adicionado pelo backend
  external_code: "CNH_UP2_1776016585706",
  payment_method: 'pix',
  payment_format: "regular",
  installments: 1,
  payment_amount: 4258,
  postback_url: null,  // Adicionado pelo backend
  pix: { expires_in_days: 1 },
  items: [...],
  customer: {...},
  extra: {...}
};
```

## ✅ Checklist de Campos

### Campos Raiz
- [x] external_code
- [x] payment_method
- [x] payment_format
- [x] installments
- [x] payment_amount

### Objeto pix
- [x] expires_in_days

### Array items[]
- [x] code
- [x] name
- [x] amount
- [x] total

### Objeto customer
- [x] name
- [x] email
- [x] document
- [x] phone
- [x] ip

### Objeto extra
- [x] cybersource_fingerprint
- [x] seon_fingerprint

## 📁 Arquivos Modificados

```
up1/checkout.html - ✅ Atualizado
up2/checkout.html - ✅ Atualizado
up3/checkout.html - ✅ Atualizado
up4/checkout.html - ✅ Atualizado
```

## 🧪 Como Testar

1. Abrir DevTools (F12)
2. Ir para aba Network
3. Acessar checkout e preencher formulário
4. Clicar em "GERAR PIX"
5. Verificar request na aba Network:

```json
// Request Payload
{
  "external_code": "CNH_UP2_1776016585706",
  "payment_method": "pix",
  "payment_format": "regular",
  "installments": 1,
  "payment_amount": 4258,
  "pix": {
    "expires_in_days": 1
  },
  "items": [{
    "code": "taxa_inscricao",
    "name": "Taxa de Inscrição CNH",
    "amount": 4258,
    "total": 4258
  }],
  "customer": {
    "name": "MARCIO PAULINO MARINHO",
    "email": "selenacripto@gmail.com",
    "document": "70520358201",
    "phone": "9294514899",
    "ip": "127.0.0.1"
  },
  "extra": {
    "cybersource_fingerprint": "mangofy_integration",
    "seon_fingerprint": "pix_payment"
  }
}
```

6. Verificar response:
```json
{
  "success": true,
  "data": {
    "transactionId": "vpar3e4nln",
    "pix": {
      "copyAndPaste": "00020101...",
      "expiresAt": "2026-04-13..."
    }
  }
}
```

## 🎯 Resultado

Agora o payload do frontend está completo e compatível com o que o backend espera, incluindo todos os campos obrigatórios para processar a transação PIX corretamente.

---

**Data**: 2026-03-05
**Status**: ✅ COMPLETO
**Páginas**: 4/4 atualizadas
**Campos**: Todos obrigatórios incluídos
