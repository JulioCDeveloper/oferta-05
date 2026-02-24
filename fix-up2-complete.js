#!/usr/bin/env node
/**
 * Script completo para corrigir TODOS os problemas do up2
 * - Caminhos de CSS/JS com %40 → @
 * - Links de fontes do Google
 * - Outros caracteres codificados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Iniciando correção completa do up2...\n');

// Encontrar todos os arquivos HTML no up2
const htmlFiles = execSync('find up2 -name "*.html" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

let totalFixed = 0;

htmlFiles.forEach(htmlPath => {
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const originalHtml = html;

    // 1. Substituir %40 por @ em todos os caminhos de CSS e JS
    html = html.replace(/href="css\/([^"]+)%40([^"]+)"/g, 'href="css/$1@$2"');
    html = html.replace(/src="([^"]+)%40([^"]+)"/g, 'src="$1@$2"');
    
    // 2. Substituir outros caracteres codificados
    html = html.replace(/%3d/gi, '=');
    html = html.replace(/%2c/gi, ',');
    html = html.replace(/%253A/gi, ':');
    html = html.replace(/%3A/gi, ':');
    html = html.replace(/%2F/gi, '/');

    // 3. Corrigir links de fontes do Google
    html = html.replace(
      /<link rel="stylesheet" id="google-fonts-1-css" href="css6b7c\.html[^"]*" media="all">/g,
      '<link rel="stylesheet" id="google-fonts-1-css" href="https://fonts.googleapis.com/css?family=Roboto:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap" media="all">'
    );

    html = html.replace(
      /<link href="css24ff7\.html[^"]*" rel="stylesheet">/g,
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">'
    );

    // Salvar apenas se houve mudanças
    if (html !== originalHtml) {
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`✅ ${htmlPath}`);
      totalFixed++;
    }
  } catch (err) {
    console.error(`❌ Erro em ${htmlPath}:`, err.message);
  }
});

console.log(`\n🎉 Total de arquivos corrigidos: ${totalFixed}`);
console.log('\n📋 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "fix: corrigir CSS/JS no up2"');
console.log('3. git push');
console.log('4. Verificar deploy na Vercel');
