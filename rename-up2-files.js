#!/usr/bin/env node
/**
 * Script para renomear arquivos CSS/JS removendo @ver=...
 * Isso resolve o problema da Vercel não servir arquivos com @ no nome
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Renomeando arquivos CSS/JS do up2...\n');

// Função para renomear arquivo
function renameFile(oldPath, newPath) {
  try {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ ${path.basename(oldPath)} → ${path.basename(newPath)}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Erro ao renomear ${oldPath}:`, err.message);
    return false;
  }
}

// Função para atualizar referências no HTML
function updateHtmlReferences(htmlPath, oldName, newName) {
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const regex = new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    html = html.replace(regex, newName);
    fs.writeFileSync(htmlPath, html, 'utf8');
    return true;
  } catch (err) {
    console.error(`❌ Erro ao atualizar ${htmlPath}:`, err.message);
    return false;
  }
}

let totalRenamed = 0;
const renamedFiles = [];

// 1. Renomear arquivos CSS
console.log('📁 Renomeando arquivos CSS...');
const cssFiles = execSync('find up2/css -name "*@*" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

cssFiles.forEach(oldPath => {
  const oldName = path.basename(oldPath);
  // Remove @ver=... mas mantém a extensão .css
  const newName = oldName.replace(/@ver=[^.]+\.css$/, '.css');
  const newPath = path.join(path.dirname(oldPath), newName);
  
  if (oldName !== newName && renameFile(oldPath, newPath)) {
    renamedFiles.push({ oldName, newName });
    totalRenamed++;
  }
});

// 2. Renomear arquivos JS na raiz
console.log('\n📁 Renomeando arquivos JS na raiz...');
const jsFiles = execSync('find up2 -maxdepth 1 -name "*@*.js" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

jsFiles.forEach(oldPath => {
  const oldName = path.basename(oldPath);
  // Remove @ver=... completamente (JS não tem extensão dupla)
  const newName = oldName.replace(/@ver=.+$/, '');
  const newPath = path.join(path.dirname(oldPath), newName);
  
  if (oldName !== newName && renameFile(oldPath, newPath)) {
    renamedFiles.push({ oldName, newName });
    totalRenamed++;
  }
});

// 3. Atualizar referências nos arquivos HTML
console.log('\n📝 Atualizando referências nos arquivos HTML...');
const htmlFiles = execSync('find up2 -name "*.html" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

htmlFiles.forEach(htmlPath => {
  let updated = false;
  renamedFiles.forEach(({ oldName, newName }) => {
    if (updateHtmlReferences(htmlPath, oldName, newName)) {
      updated = true;
    }
  });
  if (updated) {
    console.log(`✅ ${htmlPath}`);
  }
});

console.log(`\n🎉 Total de arquivos renomeados: ${totalRenamed}`);
console.log('\n📋 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "fix: renomear arquivos CSS/JS removendo @ver"');
console.log('3. git push');
