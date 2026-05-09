#!/usr/bin/env bash

set -o errexit

echo "📥 Instalando dependências..."
pip install -r requirements.txt

echo "⏳ Executando migrações..."
python manage.py migrate

echo "⏳ Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "✅ Build finalizado!"

#gunicorn core.wsgi:application
