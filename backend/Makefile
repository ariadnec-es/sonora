# Variáveis
IMAGE_NAME = sonora-api
CONTAINER_NAME = sonora-container
PORT = 8000

.PHONY: build run stop clean logs shell

# Constrói a imagem Docker
build:
	docker build -t $(IMAGE_NAME) .

# Roda o container em segundo plano
# O parâmetro -v mapeia a sua pasta local para dentro do container.
# Isso faz com que alterações no código ou no sonoradb.sqlite3 reflitam na hora.
# Roda o container (e garante que o build seja feito antes)
run: build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):8000 \
		-v $(PWD):/app \
		$(IMAGE_NAME)

# Para e remove o container
stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

# Mostra os logs da API em tempo real
logs:
	docker logs -f $(CONTAINER_NAME)

# Entra no terminal do container (útil para rodar migrations, etc)
shell:
	docker exec -it $(CONTAINER_NAME) bash

# Roda as migrações do Django dentro do container
migrate:
	docker exec -it $(CONTAINER_NAME) python manage.py migrate
