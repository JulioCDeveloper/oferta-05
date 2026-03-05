# ✅ CORREÇÃO - QR Code Base64 com Prefixo

## 🎯 Problema Identificado

O QR Code não aparecia porque o `qrCodeBase64` retornado pela API não tinha o prefixo `data:image/png;base64,` necessário para ser usado como `src` de uma tag `<img>`.

## 📊 Resposta da API

A API retorna o base64 puro, sem prefixo:

```json
{
  "paymentData": {
    "qrCodeBase64": "iVBORw0KGgoAAAANSUhEUgAAAjoAAAI6AQAAAAAGM99tAAAFiklEQVR4nO2dQW60OBCFX42ReglSDpCjuG8wR/qVI80N4Ch9gEhm2ZJRzcJVtklmNen840w/FhHQ8AmkF6t4VWWL4iHb9sdjOABBBBFEEEEEEUQQQQT9X0Bi2wRsC4BtOcqhyHKIXIHyg122AHLd/abrdzwRQQR9cVNVVURVVU1B/VwGYgLs3JzLdboiqK4AEFPQ7t51vFcjiCAAuw2+RbbbElTflqAADgEQ1C6Z74KoudxURvlveiKCCHokSK5zBmI6BDGhaBzYpchb1/1iw/r6u56IIIIeASra3ZagJcT+leqYPWcA811M7b/riQgi6N9sHk3MCmAHJOohiDcBMCcIEDKwL1IO422CAFMJR3p9j/dqBBEEbO55ACXeCIp4M9nLtTsMipgAueIo1sg3PRFBBH1pK+Jtg68CuR4cgm0JUOyAbksAttdc/uh5xB7x1Qh6apC5fgCKzQfA3DzVdL6ueIJBdS0Rd4auzQ4c79UIempQ9anNxe5lW1Uck5khnbw1VWebyiZoPFCJRiQqIGUvHdDtelFgfhfFflHZlvJpOQkQoMAhHoqELA9+IoIIesjWjdnrrGoBRqphSos36mBewxQb0TlmEzQeqMbZ4SRvD0Qs6PA9tCh8nT0fT2UTNCAIvU59kEbUs6i9PKTcYr/avwGVTdCIoE+VTgCs3GlFrY3yQpF+gHdRU9kEjQiCO3y1pK8TtbqAU8uumx3YAhEqm6ARQVXZ7uutAFyx2ZxAVRe1/Zq7z00qm6ARQa7szv2oe6UOqn0ouopr9baLn8omaDhQZ+n5J+O5EaHkbHASdbuj/VeM92oEPTWos609Ye6y7fpnzrZIzUvaiE5lEzQeqLM7YGb1yfVTj7iB+i1ZhF5FTWUTNC6o9Dy6udd1Hlx3kVLZGm8T9O31LqXFJqZDsLFbjKBBQZ/SMDZ6ww2SZOf6ULxegpmuH0Fjg3YRl/fR721LUNV0iPxKQOkWa5fEdIgleMZ9NYKeGFQcEeyTfyMCsMMEyBWAtbLvFy1NwNgn2OF3PBFBBH1tszh5u4ZcDJJNggrm90m3xUpUFTu67kfE9YBd/HpntxhBQ4Kq69fH2V7r1861GldlnE3QTwB12ZZmVpcK7Jpg9MSN37ECOCUnqWyChgOhF3U919Vnu0FSRuqaiHS3m9l1gsYEfeypQU3X9A7f7Hqu8vb6EkYjBI0J+txWkNAPyKbdPgfZVfi1WIXKJmhQkFnU+rYAZWJKm9LPZh5WvdV8436xghLmIAkaFTS1XcX+kiWmlwybCuqYtDSwAyrxr0O8curdvb45PfyJCCLoIVuLs723oPb6Nv/PTcDu03L12JvRCEEjgk411kCtjXJLz2ZlyH1Tu83Z4IWu9EYIGhB0VnHVeK3PNmf7n9rWc+0qo7IJGg5UHet+MpHTrAw+nc651/eD5U1lEzQY6JSpmdsf7UtZm8e9lnPZJ26gn03QoKB+Jp2ShnEr22pJvDOsjdmt/5fKJmhY0Oe5WIEup35KrOcuKG/JHCqboHFBcoUVX1tB9j7BvGvY+ga2GIIvMFZ6ycoqCd/xRAQR9LXttObBnCGY1equtyUpsIcM7C8+mfCsABBU4mrzEj/6iQgi6HGgbg3fsu0TYN1iNmbr6iO15dR3W7aG3WIEjQj6uIZvMwE/xNTl6mqLNCubcTZBI4LOX4vh1FhTexDadajZGwB9wpLKJmh4UFBEvQvi7aJlHTFVVSmfkXWx6qiq2F6VHb4E/QxQTNUHaY4IAH2TyeYWtu/L8xLVP+DVCHom0Mc1fLG9KgTzXXT7U4GoZZDOvqQvBJgBxT5lwXw4YLxXI+ipQf16kGgJmdTCaYu9+77eGnEzB0nQqKC6/N0Xt228VyOIIIIIIogggggiiKD/DPQ3HkoBr6vllD8AAAAASUVORK5CYII="
  }
}
```

## ✅ Solução Aplicada

Agora o código verifica se o base64 já tem o prefixo e adiciona se necessário:

### Antes:
```javascript
const qrCodeSrc = result.data.paymentData.qrCodeBase64 
  ? result.data.paymentData.qrCodeBase64 
  : result.data.paymentData.qrCodeUrl;

document.getElementById('qrCodeImage').src = qrCodeSrc;
```

### Depois:
```javascript
// Preparar QR Code
let qrCodeSrc = '';
if (result.data.paymentData.qrCodeBase64) {
  // Se for base64, adicionar prefixo se necessário
  if (result.data.paymentData.qrCodeBase64.startsWith('data:image')) {
    qrCodeSrc = result.data.paymentData.qrCodeBase64;
  } else {
    qrCodeSrc = 'data:image/png;base64,' + result.data.paymentData.qrCodeBase64;
  }
} else if (result.data.paymentData.qrCodeUrl) {
  qrCodeSrc = result.data.paymentData.qrCodeUrl;
}

document.getElementById('qrCodeImage').src = qrCodeSrc;
```

## 🔍 Como Funciona

1. **Verifica se tem qrCodeBase64**
   - Se sim, continua para o passo 2
   - Se não, usa qrCodeUrl

2. **Verifica se já tem prefixo**
   - Se começa com `data:image`, usa direto
   - Se não, adiciona `data:image/png;base64,` antes

3. **Define o src da imagem**
   - Agora a imagem carrega corretamente

## 📋 Formatos Suportados

O código agora suporta 3 formatos:

### 1. Base64 com prefixo (já pronto)
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### 2. Base64 sem prefixo (adiciona automaticamente)
```
iVBORw0KGgoAAAANSUhEUgAA...
```
↓ Transforma em:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### 3. URL externa (usa direto)
```
https://api.somossimpay.com.br/v2/finance/image/qrcode/xxx.png
```

## 🎯 Resultado

Agora o QR Code aparece corretamente em todos os casos:

- ✅ Base64 com prefixo
- ✅ Base64 sem prefixo (adiciona automaticamente)
- ✅ URL externa
- ✅ Fallback entre os formatos

## 📁 Arquivos Modificados

```
up1/checkout.html - ✅ Corrigido
up2/checkout.html - ✅ Corrigido
up3/checkout.html - ✅ Corrigido
up4/checkout.html - ✅ Corrigido
```

## ✅ Checklist de Verificação

- [x] QR Code aparece com base64 sem prefixo
- [x] QR Code aparece com base64 com prefixo
- [x] QR Code aparece com URL externa
- [x] Código PIX aparece corretamente
- [x] Timer funciona (15 min padrão)
- [x] Botão copiar verde
- [x] Todas as 4 páginas corrigidas

## 🧪 Como Testar

1. Acessar qualquer checkout (up1, up2, up3, up4)
2. Preencher formulário
3. Clicar em "GERAR PIX"
4. Verificar:
   - ✅ QR Code aparece (imagem visível)
   - ✅ Código PIX aparece abaixo
   - ✅ Timer conta de 15:00
   - ✅ Botão verde "COPIAR CÓDIGO PIX"
5. Escanear QR Code com app do banco
6. Verificar que o código é válido

---

**Data**: 2026-03-05
**Status**: ✅ COMPLETO
**Correção**: Prefixo base64 adicionado automaticamente
**Páginas**: 4/4 corrigidas
