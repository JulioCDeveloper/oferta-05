# ✅ CORREÇÃO - QR Code e Botão Copiar

## 🎯 Problemas Identificados

1. **QR Code não aparecia** - A API retorna `qrCodeUrl` mas o código estava buscando apenas `qrCodeBase64`
2. **Botão azul com ícone** - Deveria ser verde sem ícone
3. **Timer não funcionava** - `expiresAt` vinha vazio da API

## ✅ Soluções Aplicadas

### 1. QR Code - Suporte para múltiplos formatos

**Antes:**
```javascript
document.getElementById('qrCodeImage').src = result.data.paymentData.qrCodeBase64;
document.getElementById('pixCode').textContent = result.data.paymentData.qrCode;
```

**Depois:**
```javascript
// Usar qrCodeUrl se qrCodeBase64 não estiver disponível
const qrCodeSrc = result.data.paymentData.qrCodeBase64 
  ? result.data.paymentData.qrCodeBase64 
  : result.data.paymentData.qrCodeUrl;

document.getElementById('qrCodeImage').src = qrCodeSrc;
document.getElementById('pixCode').textContent = result.data.paymentData.qrCode || result.data.paymentData.copyPaste;
```

### 2. Timer - Valor padrão de 15 minutos

**Antes:**
```javascript
if (result.data.paymentData.expiresAt) {
  startPixTimer(result.data.paymentData.expiresAt);
}
```

**Depois:**
```javascript
// Iniciar timer (15 minutos padrão se expiresAt estiver vazio)
const expiresAt = result.data.paymentData.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString();
startPixTimer(expiresAt);
```

### 3. Botão Copiar - Verde sem ícone

**CSS - Antes:**
```css
.btn-copy {
  background: #2196F3; /* Azul */
}
.btn-copy:hover {
  background: #1976D2;
}
```

**CSS - Depois:**
```css
.btn-copy {
  background: #22c55e; /* Verde */
}
.btn-copy:hover {
  background: #16a34a;
}
```

**HTML - Antes:**
```html
<button class="btn-copy" onclick="copyPixCode()">
  📋 COPIAR CÓDIGO
</button>
```

**HTML - Depois:**
```html
<button class="btn-copy" onclick="copyPixCode()" style="background: #22c55e;">
  COPIAR CÓDIGO PIX
</button>
```

**JavaScript - Antes:**
```javascript
btn.textContent = '✓ Código copiado!';
btn.style.background = '#22c55e';
setTimeout(() => {
  btn.textContent = originalText;
  btn.style.background = '#2196F3'; // Voltava para azul
}, 2000);
```

**JavaScript - Depois:**
```javascript
btn.textContent = 'CÓDIGO COPIADO!';
btn.style.background = '#16a34a'; // Verde escuro
setTimeout(() => {
  btn.textContent = originalText;
  btn.style.background = '#22c55e'; // Verde normal
}, 2000);
```

## 📊 Resposta da API

A API retorna os seguintes campos:

```json
{
  "paymentData": {
    "qrCode": "00020101021226940014br.gov.bcb.pix...",
    "qrCodeUrl": "https://api.somossimpay.com.br/v2/finance/image/qrcode/xxx.png",
    "qrCodeBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "copyPaste": "00020101021226940014br.gov.bcb.pix...",
    "expiresAt": "" // Pode vir vazio
  }
}
```

**Agora o código suporta:**
- ✅ `qrCodeBase64` (preferencial)
- ✅ `qrCodeUrl` (fallback)
- ✅ `qrCode` (código PIX)
- ✅ `copyPaste` (fallback do código)
- ✅ `expiresAt` vazio (usa 15 min padrão)

## 🎨 Botão Copiar

### Estados do Botão

1. **Normal**: Verde `#22c55e` - "COPIAR CÓDIGO PIX"
2. **Hover**: Verde escuro `#16a34a`
3. **Copiado**: Verde mais escuro `#16a34a` - "CÓDIGO COPIADO!"
4. **Após 2s**: Volta ao normal

### Cores

- Verde principal: `#22c55e`
- Verde hover: `#16a34a`
- Verde copiado: `#16a34a`
- Texto: Branco `#ffffff`

## ⏱️ Timer

### Comportamento

1. Se `expiresAt` vier da API: usa o valor
2. Se `expiresAt` estiver vazio: adiciona 15 minutos a partir de agora
3. Timer conta regressivamente
4. Fica vermelho quando < 5 minutos
5. Mostra 00:00 quando expirado

### Código

```javascript
const expiresAt = result.data.paymentData.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString();
startPixTimer(expiresAt);
```

## 📁 Arquivos Modificados

```
up1/checkout.html - ✅ Corrigido
up2/checkout.html - ✅ Corrigido
up3/checkout.html - ✅ Corrigido
up4/checkout.html - ✅ Corrigido
```

## ✅ Checklist de Verificação

- [x] QR Code aparece (qrCodeBase64 ou qrCodeUrl)
- [x] Código PIX aparece (qrCode ou copyPaste)
- [x] Timer funciona (expiresAt ou 15 min padrão)
- [x] Botão verde sem ícone
- [x] Texto "COPIAR CÓDIGO PIX"
- [x] Feedback "CÓDIGO COPIADO!"
- [x] Botão permanece verde após copiar
- [x] Todas as 4 páginas corrigidas

## 🧪 Como Testar

1. Acessar qualquer checkout (up1, up2, up3, up4)
2. Preencher formulário
3. Clicar em "GERAR PIX"
4. Verificar:
   - ✅ QR Code aparece
   - ✅ Código PIX aparece
   - ✅ Timer conta de 15:00
   - ✅ Botão verde "COPIAR CÓDIGO PIX"
5. Clicar no botão copiar
6. Verificar:
   - ✅ Texto muda para "CÓDIGO COPIADO!"
   - ✅ Botão fica verde escuro
   - ✅ Após 2s volta ao normal
   - ✅ Código foi copiado para área de transferência

---

**Data**: 2026-03-05
**Status**: ✅ COMPLETO
**Páginas**: 4/4 corrigidas
