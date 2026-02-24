#!/usr/bin/env node
/**
 * Script para corrigir caminhos de CSS e JS em TODOS os arquivos HTML do up2
 * Converte %40 para @ e outros caracteres codificados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrigindo caminhos em todos os arquivos HTML do up2...\n');

// Encontrar todos os arquivos HTML no up2
const htmlFiles = execSync('find up2 -name "*.html" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

let totalFixed = 0;

htmlFiles.forEach(htmlPath => {
  try {
    // Ler o arquivo HTML
    let html = fs.readFileSync(htmlPath, 'utf8');
    const originalHtml = html;

    // Substituir %40 por @ em todos os caminhos de CSS e JS
    html = html.replace(/href="css\/([^"]+)%40([^"]+)"/g, 'href="css/$1@$2"');
    html = html.replace(/src="([^"]+)%40([^"]+)"/g, 'src="$1@$2"');
    
    // Substituir outros caracteres codificados
    html = html.replace(/%3d/gi, '=');
    html = html.replace(/%2c/gi, ',');
    html = html.replace(/%253A/gi, ':');
    html = html.replace(/%3A/gi, ':');
    html = html.replace(/%2F/gi, '/');

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
