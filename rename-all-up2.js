#!/usr/bin/env node
/**
 * Script COMPLETO para renomear TODOS os arquivos CSS/JS do up2
 * Remove @ver=... de todos os nomes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Renomeando TODOS os arquivos CSS/JS do up2...\n');

const renamedFiles = [];

// Função para renomear arquivo
function renameFile(oldPath) {
  const oldName = path.basename(oldPath);
  let newName = oldName;
  
  // Para arquivos CSS: remove @ver=...
  if (oldName.includes('@ver=') && oldName.endsWith('.css')) {
    newName = oldName.replace(/@ver=[^.]+\.css$/, '.css');
  }
  // Para arquivos JS: remove @ver=... completamente
  else if (oldName.includes('@ver=')) {
    newName = oldName.replace(/@ver=.+$/, '');
  }
  
  if (oldName === newName) return false;
  
  const newPath = path.join(path.dirname(oldPath), newName);
  
  try {
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  ${oldName} → ${newName} (já existe, pulando)`);
      return false;
    }
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${oldName} → ${newName}`);
    renamedFiles.push({ oldName, newName });
    return true;
  } catch (err) {
    console.error(`❌ Erro ao renomear ${oldName}:`, err.message);
    return false;
  }
}

// 1. Renomear arquivos CSS
console.log('📁 Renomeando arquivos CSS...');
try {
  const cssFiles = execSync('find up2/css -name "*@*" -type f', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f);
  
  cssFiles.forEach(renameFile);
} catch (err) {
  console.log('Nenhum arquivo CSS com @ encontrado');
}

// 2. Renomear arquivos JS
console.log('\n📁 Renomeando arquivos JS...');
try {
  const jsFiles = execSync('find up2 -maxdepth 1 -name "*@*" -type f', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f && (f.endsWith('.js') || f.includes('.js@')));
  
  jsFiles.forEach(renameFile);
} catch (err) {
  console.log('Nenhum arquivo JS com @ encontrado');
}

// 3. Atualizar referências nos HTMLs
console.log('\n📝 Atualizando referências nos arquivos HTML...');
const htmlFiles = execSync('find up2 -name "*.html" -type f', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

htmlFiles.forEach(htmlPath => {
  let html = fs.readFileSync(htmlPath, 'utf8');
  let changed = false;
  
  renamedFiles.forEach(({ oldName, newName }) => {
    const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOld, 'g');
    if (html.match(regex)) {
      html = html.replace(regex, newName);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ ${htmlPath}`);
  }
});

console.log(`\n🎉 Total de arquivos renomeados: ${renamedFiles.length}`);

if (renamedFiles.length > 0) {
  console.log('\n📋 Próximos passos:');
  console.log('1. git add .');
  console.log('2. git commit -m "fix: renomear arquivos CSS/JS removendo @ver"');
  console.log('3. git push');
} else {
  console.log('\n✅ Nenhum arquivo precisou ser renomeado!');
}
