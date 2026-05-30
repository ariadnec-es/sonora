-- =========================================
-- SONORA DATABASE (POSTGRESQL)
-- =========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- ENUM TYPES
-- =========================
CREATE TYPE plan_type AS ENUM (
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

-- =========================
-- TRIGGER: updated_at
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- PLANS
-- =========================
CREATE TABLE plans (
    id BIGSERIAL PRIMARY KEY,

    name plan_type NOT NULL DEFAULT 'mensal',

    start_date TIMESTAMP,
    end_date TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    email VARCHAR(255),
    first_name VARCHAR(150),
    last_name VARCHAR(150),

    plan_id BIGINT,

    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- YOUTUBE MUSICS
-- =========================
CREATE TABLE youtube_musics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),

    file VARCHAR(500),

    user_id UUID,

    observation VARCHAR(255),
    singer VARCHAR(50),
    duration VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_music_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_music_name_url
        UNIQUE (name, url)
);

CREATE TRIGGER trg_music_updated_at
BEFORE UPDATE ON youtube_musics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- EVENTS
-- =========================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    event_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100),

    manager_id UUID,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_event_manager
        FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- FOLDERS
-- =========================
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    parent_id UUID,
    event_id UUID NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_folder_parent
        FOREIGN KEY (parent_id)
        REFERENCES folders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_folder_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_folders_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- MUSIC ORDER
-- =========================
CREATE TABLE music_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    music_id UUID NOT NULL,
    event_id UUID NOT NULL,

    "order" INTEGER NOT NULL,

    status music_status NOT NULL DEFAULT 'pending',

    category music_category NOT NULL DEFAULT 'interactive',

    folder_id UUID,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_order_range
        CHECK ("order" BETWEEN 1 AND 30),

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

    CONSTRAINT uq_event_music
        UNIQUE (event_id, music_id),

    CONSTRAINT uq_event_order
        UNIQUE (event_id, "order")
);

CREATE TRIGGER trg_music_order_updated_at
BEFORE UPDATE ON music_order
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_music_user ON youtube_musics(user_id);
CREATE INDEX idx_event_manager ON events(manager_id);
CREATE INDEX idx_folder_event ON folders(event_id);
CREATE INDEX idx_music_order_event ON music_order(event_id);
CREATE INDEX idx_music_order_music ON music_order(music_id);
CREATE INDEX idx_music_order_folder ON music_order(folder_id);
CREATE INDEX idx_music_order_status ON music_order(status);