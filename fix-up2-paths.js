#!/usr/bin/env node
/**
 * Script para corrigir caminhos de CSS e JS no up2/index.html
 * Converte %40 para @ nos nomes dos arquivos
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'up2', 'index.html');

console.log('🔧 Corrigindo caminhos no up2/index.html...');

// Ler o arquivo HTML
let html = fs.readFileSync(htmlPath, 'utf8');

// Substituir %40 por @ em todos os caminhos de CSS e JS
html = html.replace(/href="css\/([^"]+)%40([^"]+)"/g, 'href="css/$1@$2"');
html = html.replace(/src="([^"]+)%40([^"]+)"/g, 'src="$1@$2"');

// Substituir %3d por = (query strings)
html = html.replace(/%3d/gi, '=');
html = html.replace(/%2c/gi, ',');
html = html.replace(/%253A/gi, ':');

// Salvar o arquivo corrigido
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('✅ Caminhos corrigidos com sucesso!');
console.log('📝 Arquivo atualizado: up2/index.html');
