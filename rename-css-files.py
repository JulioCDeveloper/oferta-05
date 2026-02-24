#!/usr/bin/env python3
"""
Renomear arquivos CSS removendo @ver=...
"""

import os
import re
import glob

print("🔧 Renomeando arquivos CSS...\n")

# Encontrar todos os arquivos CSS com @
css_files = glob.glob('up2/css/*@*.css')

renamed = []

for old_path in css_files:
    old_name = os.path.basename(old_path)
    # Remove @ver=xxx.css e mantém apenas .css
    new_name = re.sub(r'@ver=[^.]+\.css$', '.css', old_name)
    
    if old_name != new_name:
        new_path = os.path.join(os.path.dirname(old_path), new_name)
        
        if os.path.exists(new_path):
            print(f"⚠️  {old_name} → {new_name} (já existe, pulando)")
            continue
        
        try:
            os.rename(old_path, new_path)
            print(f"✅ {old_name} → {new_name}")
            renamed.append((old_name, new_name))
        except Exception as e:
            print(f"❌ Erro: {e}")

print(f"\n🎉 Total renomeado: {len(renamed)}")

# Atualizar HTML
if renamed:
    print("\n📝 Atualizando HTML...")
    html_files = glob.glob('up2/**/*.html', recursive=True)
    
    for html_path in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        changed = False
        for old_name, new_name in renamed:
            if old_name in html:
                html = html.replace(old_name, new_name)
                changed = True
        
        if changed:
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"✅ {html_path}")

print("\n✅ Concluído!")
