$ErrorActionPreference = "Stop"

# Cria o ambiente virtual se não existir
if (-not (Test-Path -Path ".venv")) {
    Write-Host "📦 Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv .venv
}

# Ativa o ambiente virtual
. .\.venv\Scripts\Activate.ps1

# Instala as dependências se o arquivo existir
if (Test-Path -Path "requirements.txt") {
    Write-Host "📥 Verificando/Instalando dependências..." -ForegroundColor Cyan
    pip install -r requirements.txt
} else {
    Write-Host "⚠️ Arquivo requirements.txt não encontrado. Pulando instalação..." -ForegroundColor DarkYellow
}

Write-Host "⏳ Executando migrações..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate
Write-Host "✅ Migrações completas!" -ForegroundColor Green

Write-Host "🚀🚀🚀 Servidor local iniciando em: http://127.0.0.1:8000" -ForegroundColor Magenta
python manage.py runserver 0.0.0.0:8000
