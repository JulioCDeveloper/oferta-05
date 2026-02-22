# CNH Social Digital 2025

Projeto de interface para CNH Social Digital 2025.

## Deploy na Vercel

### Opção 1: Deploy via CLI

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. Faça login na Vercel:
```bash
vercel login
```

3. Deploy do projeto:
```bash
vercel
```

4. Para deploy em produção:
```bash
vercel --prod
```

### Opção 2: Deploy via GitHub

1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project"
4. Importe seu repositório GitHub
5. A Vercel detectará automaticamente as configurações
6. Clique em "Deploy"

### Opção 3: Deploy via Drag & Drop

1. Acesse [vercel.com](https://vercel.com)
2. Faça login
3. Arraste a pasta do projeto para a área de upload
4. Aguarde o deploy

## Estrutura do Projeto

```
.
├── index.html          # Página inicial
├── login/              # Área de login
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
├── css/                # Estilos globais
├── js/                 # Scripts globais
└── images/             # Imagens globais
```

## APIs Utilizadas

- **Infinity Buscas**: Consulta de CPF
- **ViaCEP**: Consulta de CEP (API gratuita)

## Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome
- QR Code Generator
