CREATE DATABASE sonoraDB;

user sonoraDB;

PRAGMA foreign_keys = ON;

CREATE TABLE "plan" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "name" VARCHAR(50) DEFAULT 'mensal' NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    CONSTRAINT "check_plan_name_choices" CHECK ("name" IN ('mensal', 'anual', 'experimentacao'))
);

CREATE TABLE "users" (
    "id" VARCHAR(32) PRIMARY KEY NOT NULL, 
    
    "password" VARCHAR(128) NOT NULL,
    "last_login" DATETIME,
    "is_superuser" BOOLEAN NOT NULL DEFAULT 0, -- 0 = False, 1 = True
    "username" VARCHAR(150) UNIQUE NOT NULL,
    "first_name" VARCHAR(150) NOT NULL DEFAULT '',
    "last_name" VARCHAR(150) NOT NULL DEFAULT '',
    "email" VARCHAR(254) NOT NULL DEFAULT '',
    "is_staff" BOOLEAN NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    "date_joined" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    "is_admin" BOOLEAN NOT NULL DEFAULT 0,
    "is_manager" BOOLEAN NOT NULL DEFAULT 0,
    "plan_id" INTEGER,
    
    FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE SET NULL
);

CREATE TABLE "youtube_musics" (
    "id" VARCHAR(32) PRIMARY KEY NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "observation" VARCHAR(255),
    "singer" VARCHAR(50),
    "duration" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    
    "user_id" VARCHAR(32),
    
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
    CONSTRAINT "unique_name_url_combination" UNIQUE ("name", "url")
);

CREATE TABLE "events" (
    "id" VARCHAR(32) PRIMARY KEY NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    
    "manager_id" VARCHAR(32),
    
    FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE "music_order" (
    "id" VARCHAR(32) PRIMARY KEY NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Coluna entre aspas duplas porque "order" é palavra reservada
    "order" INTEGER NOT NULL, 
    
    "music_id" VARCHAR(32) NOT NULL,
    "event_id" VARCHAR(32) NOT NULL,
    
    CONSTRAINT "check_order_range" CHECK ("order" >= 1 AND "order" <= 30),
    CONSTRAINT "unique_event_music_combination" UNIQUE ("event_id", "music_id"),
    CONSTRAINT "unique_music_order_combination" UNIQUE ("music_id", "order"),
    
    FOREIGN KEY ("music_id") REFERENCES "youtube_musics" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE
);
