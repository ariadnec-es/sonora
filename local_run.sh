#!/bin/bash

echo "Iniciando aplicação completa..."

# 1. Frontend
echo "Iniciando frontend..."
cd frontend
npm install
npm run dev & 

# 2. Backend
echo "Iniciando backend..."
cd ../backend

# Correção: venv correto é 'source .venv/bin/activate'
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000 &

echo "Processos iniciados em segundo plano."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"

# Mantém o script vivo para você não perder o controle dos processos
wait