#!/bin/sh

echo "⏳ Aguardando banco de dados..."
sleep 5

echo "🛠️ Criando banco (se não existir)..."

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

until mysqladmin ping -h "$DB_HOST" --silent; do
  echo "⏳ Esperando MySQL..."
  sleep 2
done

echo "📦 Aplicando migrações..."
python manage.py migrate

echo "🧹 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "🚀 Iniciando servidor..."
python manage.py runserver 0.0.0.0:8000
