CREATE DATABASE sonoraDB;

USE sonoraDB;

CREATE TABLE plan (
    id BIGSERIAL PRIMARY KEY, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    name VARCHAR(50) DEFAULT 'mensal' NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT check_plan_name_choices CHECK (name IN ('mensal', 'anual', 'experimentacao'))
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,
    plan_id BIGINT, 
    
    CONSTRAINT fk_users_plan FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE SET NULL
);

CREATE TABLE youtube_musics (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    observation VARCHAR(255),
    singer VARCHAR(50),
    duration VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    user_id UUID, 
    
    CONSTRAINT fk_youtube_musics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_name_url_combination UNIQUE (name, url)
);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    manager_id UUID, 
    
    CONSTRAINT fk_events_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE music_order (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    "order" INTEGER NOT NULL, 
    
    music_id UUID NOT NULL,
    event_id UUID NOT NULL,
    
    CONSTRAINT check_order_range CHECK ("order" >= 1 AND "order" <= 30),
    
    CONSTRAINT fk_music_order_music FOREIGN KEY (music_id) REFERENCES youtube_musics(id) ON DELETE CASCADE,
    CONSTRAINT fk_music_order_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_event_music_combination UNIQUE (event_id, music_id),
    CONSTRAINT unique_music_order_combination UNIQUE (music_id, "order")
);
