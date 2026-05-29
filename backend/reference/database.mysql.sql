CREATE DATABASE IF NOT EXISTS sonoradb;
USE sonoradb;

SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- TABELA: plans
-- =========================================================
CREATE TABLE plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name ENUM('mensal', 'anual', 'experimentacao')
        NOT NULL DEFAULT 'mensal',

    start_date DATETIME NULL,
    end_date DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TABELA: users
-- =========================================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- UUID

    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    first_name VARCHAR(150),
    last_name VARCHAR(150),
    email VARCHAR(254) UNIQUE,

    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,

    plan_id BIGINT NULL,

    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE SET NULL
);

-- =========================================================
-- TABELA: youtube_musics
-- =========================================================
CREATE TABLE youtube_musics (
    id CHAR(36) PRIMARY KEY, -- UUID

    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NULL,
    file VARCHAR(255) NULL,

    user_id CHAR(36) NULL,

    observation VARCHAR(255) NULL,
    singer VARCHAR(50) NULL,
    duration VARCHAR(20) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

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
    id CHAR(36) PRIMARY KEY, -- UUID

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    event_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(100) NULL,

    manager_id CHAR(36) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_manager
        FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- TABELA: folders
-- =========================================================
CREATE TABLE folders (
    id CHAR(36) PRIMARY KEY, -- UUID

    name VARCHAR(100) NOT NULL,

    parent_id CHAR(36) NULL,
    event_id CHAR(36) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

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
    id CHAR(36) PRIMARY KEY, -- UUID

    music_id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL,

    `order` INT NOT NULL,

    status ENUM('pending', 'accepted', 'rejected')
        NOT NULL DEFAULT 'pending',

    category ENUM('interactive', 'background')
        NOT NULL DEFAULT 'interactive',

    folder_id CHAR(36) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_order_range
        CHECK (`order` >= 1 AND `order` <= 30),

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
        UNIQUE (event_id, `order`)
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

SET FOREIGN_KEY_CHECKS = 1;