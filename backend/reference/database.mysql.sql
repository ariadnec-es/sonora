CREATE DATABASE sonora
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sonora;

-- =========================
-- PLANS
-- =========================
CREATE TABLE plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name ENUM(
        'mensal',
        'anual',
        'experimentacao'
    ) NOT NULL DEFAULT 'mensal',

    start_date DATETIME NULL,
    end_date DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,

    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    email VARCHAR(255) NULL,
    first_name VARCHAR(150) NULL,
    last_name VARCHAR(150) NULL,

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

-- =========================
-- YOUTUBE MUSICS
-- =========================
CREATE TABLE youtube_musics (
    id CHAR(36) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NULL,

    file VARCHAR(500) NULL,

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

    CONSTRAINT uq_music_name_url
        UNIQUE (name, url)
);

-- =========================
-- EVENTS
-- =========================
CREATE TABLE events (
    id CHAR(36) PRIMARY KEY,

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

-- =========================
-- FOLDERS
-- =========================
CREATE TABLE folders (
    id CHAR(36) PRIMARY KEY,

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

-- =========================
-- MUSIC ORDER
-- =========================
CREATE TABLE music_order (
    id CHAR(36) PRIMARY KEY,

    music_id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL,

    `order` INT NOT NULL,

    status ENUM(
        'pending',
        'accepted',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    category ENUM(
        'interactive',
        'background'
    ) NOT NULL DEFAULT 'interactive',

    folder_id CHAR(36) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_music_order
        CHECK (`order` BETWEEN 1 AND 30),

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
        UNIQUE (event_id, `order`)
);