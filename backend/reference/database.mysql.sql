CREATE DATABASE IF NOT EXISTS sonoradb;
USE sonoradb;

CREATE TABLE IF NOT EXISTS plans (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS youtube_musics (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    user_id CHAR(36) NULL,
    observation VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_youtube_music_name_url
        UNIQUE (name, url),

    CONSTRAINT fk_youtube_music_user
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_manager
        FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS link_event_musics (
    id CHAR(36) PRIMARY KEY,
    music_id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_event_music
        UNIQUE (event_id, music_id),

    CONSTRAINT fk_link_music
        FOREIGN KEY (music_id)
        REFERENCES youtube_musics(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_link_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);