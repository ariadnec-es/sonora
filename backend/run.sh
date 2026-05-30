#!/bin/bash

# Faz o script parar imediatamente se qualquer comando der erro
set -e

# Verifica se a pasta .venv NÃO existe. Se não existir, ele cria.
if [ ! -d ".venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Opcional: Se você usa requirements.txt, é bom garantir que as libs estão atualizadas
echo "📥 Instalando/Atualizando dependências..."
pip install -r requirements.txt

echo "⏳ Executando migrações..."
python manage.py makemigrations
python manage.py migrate
echo "✅ Migrações completas!"

python manage.py collectstatic --noinput

echo "🚀🚀🚀 Servidor local iniciando em: http://127.0.0.1:8000"
python manage.py runserver 0.0.0.0:8000
