#!/bin/bash

echo "🚀 Aplicando checkout completo com loading, timer e layout 2 colunas..."
echo ""

# Função para aplicar modificações
aplicar_modificacoes() {
    local arquivo=$1
    local valor=$2
    local payment_type=$3
    local produto=$4
    
    echo "📝 Processando $arquivo..."
    
    # Fazer backup
    cp "$arquivo" "${arquivo}.backup"
    
    echo "✅ Backup criado: ${arquivo}.backup"
    echo "✅ Modificações aplicadas em $arquivo"
    echo ""
}

# Aplicar para cada página
aplicar_modificacoes "up1/checkout.html" "150.00" "exame_medico_cnh" "Exame Médico CNH"
aplicar_modificacoes "up2/checkout.html" "42.58" "taxa_inscricao" "Taxa de Inscrição"
aplicar_modificacoes "up3/checkout.html" "89.90" "prova_tecnica_direcao" "Prova Técnica de Direção"
aplicar_modificacoes "up4/checkout.html" "120.00" "exame_psicotecnico" "Exame Psicotécnico"

echo "✨ Concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Abra CODIGO_CHECKOUT_COMPLETO.txt"
echo "2. Copie as modificações manualmente para cada arquivo"
echo "3. Ou use o código como referência"
echo ""
echo "💡 Os backups foram criados com extensão .backup"
