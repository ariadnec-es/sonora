-- Criar banco MySQL
CREATE DATABASE sonoraDB;
USE sonoraDB;

-- Tabela de planos
CREATE TABLE plan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- Tabela de usuários (evitando nome reservado)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    plan_id INT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_user_plan
        FOREIGN KEY (plan_id) REFERENCES plan(id)
);

-- Tabela de músicas
CREATE TABLE youtube_music (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    user_id INT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_music_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de eventos
CREATE TABLE event (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100),
    youtube_music_id INT,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_event_music
        FOREIGN KEY (youtube_music_id) REFERENCES youtube_music(id),

    CONSTRAINT fk_event_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);
