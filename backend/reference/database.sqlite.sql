PRAGMA foreign_keys = ON;

-- =========================
-- PLAN
-- =========================
CREATE TABLE plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (
        name IN ('mensal', 'anual', 'experimentacao')
    ),
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    first_name TEXT,
    last_name TEXT,

    plan_id INTEGER,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_manager INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);

-- =========================
-- YOUTUBE MUSICS
-- =========================
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

    UNIQUE(name, url)
);

-- =========================
-- EVENTS
-- =========================
CREATE TABLE events (
    id TEXT PRIMARY KEY, -- UUID

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

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

-- =========================
-- FOLDERS
-- =========================
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

-- =========================
-- MUSIC ORDER
-- =========================
CREATE TABLE music_order (
    id TEXT PRIMARY KEY, -- UUID

    music_id TEXT NOT NULL,
    event_id TEXT NOT NULL,

    "order" INTEGER NOT NULL
        CHECK ("order" BETWEEN 1 AND 30),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'accepted',
                'rejected'
            )
        ),

    category TEXT NOT NULL DEFAULT 'interactive'
        CHECK (
            category IN (
                'interactive',
                'background'
            )
        ),

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

    UNIQUE(event_id, music_id),
    UNIQUE(event_id, "order")
);