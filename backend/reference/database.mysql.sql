-- Criar banco (opcional, conforme sua preferência)
CREATE DATABASE IF NOT EXISTS sonoraDB;
USE sonoraDB;

-- Tabela de planos
CREATE TABLE plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários (AbstractUser base)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- UUID armazenado como string
    username VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    email VARCHAR(254),
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    plan_id INT,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_plan
        FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE SET NULL
);

-- Tabela de músicas
CREATE TABLE youtube_music (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    user_id CHAR(36),
    observation VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_music_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de eventos
CREATE TABLE event (
    id CHAR(36) PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    youtube_music_id CHAR(36) NOT NULL,
    manager_id CHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_music
        FOREIGN KEY (youtube_music_id) REFERENCES youtube_music(id) ON DELETE CASCADE,

    CONSTRAINT fk_event_manager
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
);