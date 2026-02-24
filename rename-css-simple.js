const fs = require('fs');
const path = require('path');

// Renomear arquivos CSS
const cssDir = 'up2/css';
const files = fs.readdirSync(cssDir);

const renamed = [];

files.forEach(oldName => {
  if (oldName.includes('@ver=') && oldName.endsWith('.css')) {
    // Remove tudo entre @ e .css, mantém apenas .css
    const newName = oldName.replace(/@ver=.*\.css$/, '.css');
    
    if (oldName !== newName) {
      const oldPath = path.join(cssDir, oldName);
      const newPath = path.join(cssDir, newName);
      
      if (fs.existsSync(newPath)) {
        console.log(`⚠️  ${oldName} → ${newName} (já existe)`);
        return;
      }
      
      fs.renameSync(oldPath, newPath);
      console.log(`✅ ${oldName} → ${newName}`);
      renamed.push({ oldName, newName });
    }
  }
});

console.log(`\n🎉 Renomeados: ${renamed.length}`);

// Atualizar HTML
if (renamed.length > 0) {
  console.log('\n📝 Atualizando HTML...');
  const htmlFiles = ['up2/index.html', 'up2/index-3.html'];
  
  htmlFiles.forEach(htmlPath => {
    let html = fs.readFileSync(htmlPath, 'utf8');
    let changed = false;
    
    renamed.forEach(({ oldName, newName }) => {
      if (html.includes(oldName)) {
        html = html.replaceAll(oldName, newName);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`✅ ${htmlPath}`);
    }
  });
}
