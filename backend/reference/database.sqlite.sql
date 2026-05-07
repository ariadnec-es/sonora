-- SQLite não usa AUTO_INCREMENT ou UUID nativo, 
-- ele usa INTEGER PRIMARY KEY para chaves sequenciais 
-- ou TEXT para chaves UUID.

-- Tabela de planos
CREATE TABLE "plan" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(50) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL
);

-- Tabela de usuários
CREATE TABLE "users" (
    "password" varchar(128) NOT NULL,
    "last_login" datetime NULL,
    "is_superuser" bool NOT NULL,
    "username" varchar(150) NOT NULL UNIQUE,
    "first_name" varchar(150) NOT NULL,
    "last_name" varchar(150) NOT NULL,
    "email" varchar(254) NOT NULL,
    "is_staff" bool NOT NULL,
    "is_active" bool NOT NULL,
    "date_joined" datetime NOT NULL,
    "id" char(32) NOT NULL PRIMARY KEY,
    "plan_id" integer NULL REFERENCES "plan" ("id") DEFERRABLE INITIALLY DEFERRED,
    "is_admin" bool NOT NULL
);

-- Tabela de músicas
CREATE TABLE "youtube_music" (
    "id" char(32) NOT NULL PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "url" varchar(255) NOT NULL,
    "observation" varchar(255) NULL,
    "is_active" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "user_id" char(32) NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- Tabela de eventos
CREATE TABLE "event" (
    "id" char(32) NOT NULL PRIMARY KEY,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "event_name" varchar(100) NOT NULL,
    "is_active" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "youtube_music_id" char(32) NOT NULL REFERENCES "youtube_music" ("id") DEFERRABLE INITIALLY DEFERRED,
    "manager_id" char(32) NOT NULL REFERENCES "users" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- Índices (O Django cria automaticamente para otimizar FKs)
CREATE INDEX "users_plan_id_id" ON "users" ("plan_id");
CREATE INDEX "youtube_music_user_id" ON "youtube_music" ("user_id");
CREATE INDEX "event_youtube_music_id" ON "event" ("youtube_music_id");
CREATE INDEX "event_manager_id" ON "event" ("manager_id");