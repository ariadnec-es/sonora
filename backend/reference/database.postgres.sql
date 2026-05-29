-- =========================================================
-- EXTENSÃO PARA UUID
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- TIPO ENUM
-- =========================================================

CREATE TYPE plan_choice AS ENUM (
    'mensal',
    'anual',
    'experimentacao'
);

CREATE TYPE music_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);

CREATE TYPE music_category AS ENUM (
    'interactive',
    'background'
);

-- =========================================================
-- TABELA: plans
-- =========================================================
CREATE TABLE plans (
    id BIGSERIAL PRIMARY KEY,

    name plan_choice
        NOT NULL DEFAULT 'mensal',

    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABELA: users
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    first_name VARCHAR(150),
    last_name VARCHAR(150),
    email VARCHAR(254) UNIQUE,

    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,

    plan_id BIGINT NULL,

    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);

-- =========================================================
-- TABELA: youtube_musics
-- =========================================================
CREATE TABLE youtube_musics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    file VARCHAR(255),

    user_id UUID NULL,

    observation VARCHAR(255),
    singer VARCHAR(50),
    duration VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_music_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_name_url_combination
        UNIQUE (name, url)
);

-- =========================================================
-- TABELA: events
-- =========================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    event_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),

    manager_id UUID NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_manager
        FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- TABELA: folders
-- =========================================================
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    parent_id UUID NULL,
    event_id UUID NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_folder_parent
        FOREIGN KEY (parent_id)
        REFERENCES folders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_folder_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- =========================================================
-- TABELA: music_order
-- =========================================================
CREATE TABLE music_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    music_id UUID NOT NULL,
    event_id UUID NOT NULL,

    "order" INTEGER NOT NULL
        CHECK ("order" >= 1 AND "order" <= 30),

    status music_status
        NOT NULL DEFAULT 'pending',

    category music_category
        NOT NULL DEFAULT 'interactive',

    folder_id UUID NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_music_order_music
        FOREIGN KEY (music_id)
        REFERENCES youtube_musics(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_music_order_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_music_order_folder
        FOREIGN KEY (folder_id)
        REFERENCES folders(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_event_music_combination
        UNIQUE (event_id, music_id),

    CONSTRAINT unique_event_order_combination
        UNIQUE (event_id, "order")
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_users_plan_id
ON users(plan_id);

CREATE INDEX idx_music_user_id
ON youtube_musics(user_id);

CREATE INDEX idx_events_manager_id
ON events(manager_id);

CREATE INDEX idx_folders_parent_id
ON folders(parent_id);

CREATE INDEX idx_folders_event_id
ON folders(event_id);

CREATE INDEX idx_music_order_music_id
ON music_order(music_id);

CREATE INDEX idx_music_order_event_id
ON music_order(event_id);

CREATE INDEX idx_music_order_folder_id
ON music_order(folder_id);