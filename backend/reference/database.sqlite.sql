CREATE DATABASE IF NOT EXISTS sonoradb;
USE sonoradb;

CREATE TABLE IF NOT EXISTS plans (
    email VARCHAR(254) NULL,
    is_staff BOOLEAN DEFAULT 0,
    is_superuser BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,

    plan_id INTEGER NULL,
    is_admin BOOLEAN DEFAULT 0,
    is_manager BOOLEAN DEFAULT 0,

    FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS youtube_musics (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    user_id CHAR(36) NULL,
    observation VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(name, url),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS events (
    id CHAR(36) PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    manager_id CHAR(36) NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS link_event_musics (
    id CHAR(36) PRIMARY KEY,
    music_id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(event_id, music_id),

    FOREIGN KEY (music_id)
        REFERENCES youtube_musics(id)
        ON DELETE CASCADE,

    FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);