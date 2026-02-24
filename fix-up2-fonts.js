#!/usr/bin/env node
/**
 * Script para corrigir links de fontes do Google no up2/index.html
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'up2', 'index.html');

console.log('🔧 Corrigindo links de fontes no up2/index.html...');

let html = fs.readFileSync(htmlPath, 'utf8');

// Substituir link do Roboto por link direto do Google Fonts
html = html.replace(
  /<link rel="stylesheet" id="google-fonts-1-css" href="css6b7c\.html[^"]*" media="all">/g,
  '<link rel="stylesheet" id="google-fonts-1-css" href="https://fonts.googleapis.com/css?family=Roboto:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&display=swap" media="all">'
);

// Substituir link do Inter por link direto do Google Fonts
html = html.replace(
  /<link href="css24ff7\.html[^"]*" rel="stylesheet">/g,
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">'
);

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('✅ Links de fontes corrigidos!');
