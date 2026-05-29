PRAGMA foreign_keys = ON;

-- =========================================================
-- TABELA: plans
-- =========================================================
CREATE TABLE plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL
        CHECK (name IN ('mensal', 'anual', 'experimentacao'))
        DEFAULT 'mensal',

    start_date DATETIME,
    end_date DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABELA: users
-- =========================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID

    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,

    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,

    is_staff INTEGER NOT NULL DEFAULT 0,
    is_superuser INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,

    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,

    plan_id INTEGER,

    is_admin INTEGER NOT NULL DEFAULT 0,
    is_manager INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);

-- =========================================================
-- TABELA: youtube_musics
-- =========================================================
CREATE TABLE youtube_musics (
    id TEXT PRIMARY KEY, -- UUID

    name TEXT NOT NULL,
    url TEXT,
    file TEXT,

    user_id TEXT,

    observation TEXT,
    singer TEXT,
    duration TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

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
    id TEXT PRIMARY KEY, -- UUID

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    CHECK (end_date >= start_date),

    event_name TEXT NOT NULL UNIQUE,
    location TEXT,

    manager_id TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- TABELA: folders
-- =========================================================
CREATE TABLE folders (
    id TEXT PRIMARY KEY, -- UUID

    name TEXT NOT NULL,

    parent_id TEXT,
    event_id TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id)
        REFERENCES folders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- =========================================================
-- TABELA: music_order
-- =========================================================
CREATE TABLE music_order (
    id TEXT PRIMARY KEY, -- UUID

    music_id TEXT NOT NULL,
    event_id TEXT NOT NULL,

    "order" INTEGER NOT NULL
        CHECK ("order" >= 1 AND "order" <= 30),

    status TEXT NOT NULL
        CHECK (status IN ('pending', 'accepted', 'rejected'))
        DEFAULT 'pending',

    category TEXT NOT NULL
        CHECK (category IN ('interactive', 'background'))
        DEFAULT 'interactive',

    folder_id TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (music_id)
        REFERENCES youtube_musics(id)
        ON DELETE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

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

CREATE INDEX idx_youtube_musics_user_id
ON youtube_musics(user_id);

CREATE INDEX idx_events_manager_id
ON events(manager_id);

CREATE INDEX idx_folders_event_id
ON folders(event_id);

CREATE INDEX idx_folders_parent_id
ON folders(parent_id);

CREATE INDEX idx_music_order_event_id
ON music_order(event_id);

CREATE INDEX idx_music_order_music_id
ON music_order(music_id);

CREATE INDEX idx_music_order_folder_id
ON music_order(folder_id);

-- =========================================================
-- TRIGGERS PARA updated_at
-- =========================================================

CREATE TRIGGER trg_plans_updated_at
AFTER UPDATE ON plans
FOR EACH ROW
BEGIN
    UPDATE plans
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER trg_youtube_musics_updated_at
AFTER UPDATE ON youtube_musics
FOR EACH ROW
BEGIN
    UPDATE youtube_musics
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER trg_events_updated_at
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    UPDATE events
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER trg_folders_updated_at
AFTER UPDATE ON folders
FOR EACH ROW
BEGIN
    UPDATE folders
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER trg_music_order_updated_at
AFTER UPDATE ON music_order
FOR EACH ROW
BEGIN
    UPDATE music_order
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;