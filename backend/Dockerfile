FROM python:3.12-slim

# Evita gerar .pyc e buffer no log
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Diretório de trabalho
WORKDIR /app

# Dependências do sistema (necessárias pro mysqlclient)
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    default-mysql-client \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements primeiro (melhora cache)
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia projeto
COPY . .

# Dá permissão pro script
RUN chmod +x /app/entrypoint.sh

# Porta do Django
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
