#!/bin/bash
# Script para fazer push dos commits para o GitHub

echo "=========================================="
echo "Push para GitHub - Loquia Frontend"
echo "=========================================="
echo ""
echo "Este script irá enviar 9 commits para o GitHub:"
echo ""
git log origin/main..HEAD --oneline
echo ""
echo "=========================================="
echo ""
read -p "Deseja continuar? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]
then
    echo "Fazendo push..."
    git push origin main
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Push realizado com sucesso!"
        echo ""
        echo "Próximos passos:"
        echo "1. Aguarde 2-5 minutos para o Vercel fazer deploy"
        echo "2. Acesse https://loquia.com.br/"
        echo "3. Verifique a seção Intent Proof Dashboard"
    else
        echo ""
        echo "❌ Erro ao fazer push. Verifique suas credenciais."
    fi
else
    echo "Push cancelado."
fi
