#!/usr/bin/env node
/**
 * Corrigir arquivos .css.css para .css
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrigindo arquivos .css.css...\n');

// Encontrar todos os arquivos .css.css
const files = execSync('find up2 -name "*.css.css" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

const renamedFiles = [];

files.forEach(oldPath => {
  const newPath = oldPath.replace(/\.css\.css$/, '.css');
  const oldName = path.basename(oldPath);
  const newName = path.basename(newPath);
  
  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${oldName} → ${newName}`);
    renamedFiles.push({ oldName, newName });
  } catch (err) {
    console.error(`❌ Erro: ${err.message}`);
  }
});

// Atualizar HTML
console.log('\n📝 Atualizando HTML...');
const htmlFiles = execSync('find up2 -name "*.html" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

htmlFiles.forEach(htmlPath => {
  let html = fs.readFileSync(htmlPath, 'utf8');
  let changed = false;
  
  renamedFiles.forEach(({ oldName, newName }) => {
    if (html.includes(oldName)) {
      html = html.replace(new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newName);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ ${htmlPath}`);
  }
});

console.log(`\n🎉 Corrigidos ${renamedFiles.length} arquivos`);
