# Usa uma imagem oficial do Python, versão leve
FROM python:3.11-slim

# Evita que o Python grave arquivos .pyc no disco
ENV PYTHONDONTWRITEBYTECODE=1
# Garante que os logs do Python saiam no terminal em tempo real
ENV PYTHONUNBUFFERED=1

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o requirements.txt primeiro (para aproveitar o cache do Docker)
COPY requirements.txt /app/

# Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o resto do projeto para dentro do container
COPY . /app/

# Expõe a porta que o Django vai usar
EXPOSE 8000

# Comando para rodar a API permitindo acesso externo (0.0.0.0)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
