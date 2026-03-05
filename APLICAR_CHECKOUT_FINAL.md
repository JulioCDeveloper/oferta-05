# 🎯 Como Aplicar o Checkout Completo

## ✅ O que será adicionado:

1. ⏳ **Loading fullscreen** ao gerar PIX
2. ⏱️ **Timer de expiração** contando regressivamente  
3. 📊 **Layout em 2 colunas** (QR Code + Detalhes)
4. 📝 **Instruções formatadas** com 3 passos
5. 🖼️ **Imagem do produto** na lateral

---

## 📋 OPÇÃO 1: Aplicação Manual (Recomendado)

### Passo 1: Abrir arquivo
```bash
# Abra o arquivo no editor
code up2/checkout.html
# ou
nano up2/checkout.html
```

### Passo 2: Adicionar Loading Screen

**Localizar**: Logo após a tag `<body>`

**Adicionar**:
```html
<!-- Loading Screen -->
<div id="loadingScreen" class="loading-fullscreen">
  <div class="spinner"></div>
  <p>Gerando seu código PIX...</p>
</div>
```

### Passo 3: Adicionar CSS do Loading

**Localizar**: Dentro da tag `<style>`

**Adicionar** (no final do CSS):
```css
/* Loading Screen */
.loading-fullscreen {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 10000;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.loading-fullscreen.active { display: flex; }

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-fullscreen p {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
}

/* Modal 2 Colunas */
.modal-content {
  max-width: 1000px !important;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .modal-grid { grid-template-columns: 1fr; }
}

.modal-left {
  border-right: 1px solid #eee;
  padding-right: 30px;
}

.modal-right { padding-left: 10px; }

@media (max-width: 768px) {
  .modal-left {
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 30px;
    margin-bottom: 30px;
  }
  .modal-right { padding-left: 0; }
}
```

### Passo 4: Modificar JavaScript

**Localizar**: A função `document.getElementById('btnGerarPix').addEventListener`

**Modificar**: Adicionar loading antes e depois da requisição:

```javascript
// ADICIONAR ESTA LINHA logo após validação:
document.getElementById('loadingScreen').classList.add('active');

try {
  const response = await fetch(...);
  const result = await response.json();
  
  // ADICIONAR ESTA LINHA após receber resposta:
  document.getElementById('loadingScreen').classList.remove('active');
  
  // ... resto do código ...
  
  // ADICIONAR TIMER:
  if (result.data.paymentData.expiresAt) {
    startPixTimer(result.data.paymentData.expiresAt);
  }
  
} catch (error) {
  // ADICIONAR ESTA LINHA no catch:
  document.getElementById('loadingScreen').classList.remove('active');
  alert('Erro ao gerar PIX. Tente novamente.');
}
```

### Passo 5: Adicionar Função do Timer

**Localizar**: Antes da função `connectWebSocket`

**Adicionar**:
```javascript
let timerInterval = null;

function startPixTimer(expiresAt) {
  const timerElement = document.getElementById('pixTimer');
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) {
      clearInterval(timerInterval);
      timerElement.textContent = '00:00';
      timerElement.style.color = '#dc2626';
      return;
    }
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (minutes < 5) timerElement.style.color = '#dc2626';
  }, 1000);
}
```

### Passo 6: Modificar função closePixModal

**Localizar**: A função `closePixModal`

**Adicionar** no final:
```javascript
function closePixModal() {
  document.getElementById('pixModal').classList.remove('active');
  if (wsConnection) wsConnection.close();
  if (timerInterval) clearInterval(timerInterval); // ADICIONAR ESTA LINHA
}
```

### Passo 7: Substituir HTML do Modal

**Localizar**: Todo o conteúdo dentro de `<div class="modal" id="pixModal">`

**Substituir por**: (Veja o código completo em `CODIGO_CHECKOUT_COMPLETO.txt`)

---

## 📋 OPÇÃO 2: Código Completo Pronto

Abra o arquivo `CODIGO_CHECKOUT_COMPLETO.txt` e copie as seções necessárias.

---

## 🔄 Aplicar em Todas as Páginas

Depois de modificar `up2/checkout.html`, repita para:

### UP1 (R$ 150,00)
- Arquivo: `up1/checkout.html`
- Valor: `150.00`
- Payment Type: `exame_medico_cnh`
- Produto: `Exame Médico CNH`

### UP3 (R$ 89,90)
- Arquivo: `up3/checkout.html`
- Valor: `89.90`
- Payment Type: `prova_tecnica_direcao`
- Produto: `Prova Técnica de Direção`

### UP4 (R$ 120,00)
- Arquivo: `up4/checkout.html`
- Valor: `120.00`
- Payment Type: `exame_psicotecnico`
- Produto: `Exame Psicotécnico`

---

## ✅ Checklist de Verificação

Após aplicar as modificações, verifique:

- [ ] Loading aparece ao clicar em "GERAR PIX"
- [ ] Loading desaparece após resposta da API
- [ ] Timer aparece no modal
- [ ] Timer conta regressivamente
- [ ] Timer fica vermelho
- [ ] Modal tem 2 colunas
- [ ] QR Code à esquerda
- [ ] Detalhes à direita
- [ ] Imagem do produto aparece
- [ ] Instruções estão formatadas
- [ ] Logo PIX + "Ambiente seguro" aparece
- [ ] Responsivo no mobile (1 coluna)

---

## 🧪 Como Testar

```bash
# 1. Reiniciar servidor
node index0server.js

# 2. Acessar
http://localhost:8080/up2/

# 3. Clicar em pagar

# 4. Preencher formulário

# 5. Clicar em "GERAR PIX"
# ✅ Deve aparecer loading branco com spinner

# 6. Aguardar 1-2 segundos
# ✅ Loading desaparece
# ✅ Modal abre com 2 colunas
# ✅ Timer aparece contando

# 7. Verificar layout
# ✅ QR Code à esquerda
# ✅ Detalhes à direita
# ✅ Imagem do produto
# ✅ Instruções formatadas
# ✅ Logo PIX

# 8. Copiar código
# ✅ Feedback visual

# 9. Aguardar timer
# ✅ Conta regressivamente
# ✅ Fica vermelho quando < 5 min
```

---

## 🎨 Resultado Final

Após aplicar todas as modificações, você terá:

✅ Loading fullscreen profissional
✅ Timer de expiração funcionando
✅ Layout em 2 colunas idêntico ao print
✅ Instruções formatadas com círculos numerados
✅ Imagem do produto na lateral
✅ Logo PIX + "Ambiente seguro"
✅ 100% responsivo
✅ 100% funcional
✅ 100% integrado com API

---

## 📞 Suporte

Se tiver dúvidas:
1. Consulte `CODIGO_CHECKOUT_COMPLETO.txt` para código completo
2. Consulte `README_CHECKOUT_FINAL.md` para visão geral
3. Teste passo a passo seguindo o checklist

---

**Tempo estimado**: 30-40 minutos para aplicar em todas as 4 páginas

**Dificuldade**: ⭐⭐ Médio (copiar e colar com atenção)

**Resultado**: ⭐⭐⭐⭐⭐ Checkout 100% completo e profissional!
