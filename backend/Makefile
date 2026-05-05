# Nome do projeto (opcional)
PROJECT_NAME=sonora

# Comando padrão (Docker Compose v2)
DC=docker compose

# ========================
# 🚀 Subir ambiente
# ========================
up:
	$(DC) up --build

up-d:
	$(DC) up --build -d

# ========================
# 🛑 Parar ambiente
# ========================
down:
	$(DC) down

# ========================
# 🔄 Rebuild
# ========================
build:
	$(DC) build

rebuild:
	$(DC) down -v
	$(DC) up --build

# ========================
# 📜 Logs
# ========================
logs:
	$(DC) logs -f

logs-api:
	$(DC) logs -f api

logs-db:
	$(DC) logs -f db

# ========================
# 🧹 Limpeza
# ========================
clean:
	$(DC) down -v --remove-orphans

# ========================
# 🧠 Comandos Django
# ========================
migrate:
	$(DC) exec api python manage.py migrate

makemigrations:
	$(DC) exec api python manage.py makemigrations

createsuperuser:
	$(DC) exec api python manage.py createsuperuser

shell:
	$(DC) exec api python manage.py shell

# ========================
# 🐚 Acesso ao container
# ========================
bash:
	$(DC) exec api bash

# ========================
# 🔁 Restart
# ========================
restart:
	$(DC) restart

restart-api:
	$(DC) restart api

restart-db:
	$(DC) restart db
