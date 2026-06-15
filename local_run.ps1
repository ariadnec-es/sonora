Write-Host "Iniciando aplicação completa..."

# Frontend
Write-Host "Iniciando frontend..."
Set-Location frontend

npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Backend
Write-Host "Iniciando backend..."
Set-Location ..\backend

# Criar ambiente virtual, se necessário
if (!(Test-Path ".venv")) {
    python -m venv .venv
}

# Ativar ambiente virtual
& ".\.venv\Scripts\Activate.ps1"

# Instalar dependências
pip install -r requirements.txt

# Executar migrações
python manage.py migrate --noinput

# Iniciar backend em uma nova janela
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\.venv\Scripts\Activate.ps1'; python manage.py runserver 0.0.0.0:8000"

Write-Host ""
Write-Host "Processos iniciados."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:8000"