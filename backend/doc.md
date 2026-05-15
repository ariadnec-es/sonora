# 🎵 Documentação do Projeto SonoraAPI

Bem-vindo à documentação do backend do projeto Sonora. Esta API foi construída com **Django** e **Django REST Framework**, utilizando **JWT** para autenticação e **UUIDs** como identificadores únicos.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
*   Python 3.10 ou superior
*   Pip (gerenciador de pacotes do Python)
*   Node.js (opcional, para pings com o script JS)

---

## 🚀 Scripts de Auxílio

- `Execute (linux)`
```bash
chmod +x run.sh; ./run.sh
````

Descrição: O arquivo `run.sh` é um script que automatiza a execução do servidor Django.

* `Execute (windows)`

```powershell
.\run.ps1
```

Descrição: O arquivo `run.ps1` é um script que automatiza a execução do servidor Django.

* Caso algum processo não funcione abaixo contém um passo a passo de como fazer.

---

# ⚙️ Configuração do Ambiente (Servidor Django)

## 1. Clonar o repositório e configurar ambiente virtual

### No Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

### No Windows (PowerShell)

```powershell
# Cria o ambiente virtual
python -m venv venv

# Ativa o ambiente virtual
.\venv\Scripts\activate
```

> Nota: Se o PowerShell bloquear a execução, rode:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

e tente ativar novamente.

---

## 2. Instalar dependências

O comando é o mesmo para todos os sistemas:

```bash
pip install -r requirements.txt
```

---

## 3. Configurar variáveis de ambiente

No Windows, você pode criar o arquivo `.env` usando o Bloco de Notas ou o VS Code.

1. Na raiz do projeto, crie um arquivo chamado `.env`
2. Cole as configurações:

```env
SECRET_KEY=sua_chave_secreta_aqui
DEBUG=True
```

---

## 4. Rodar Migrações

```bash
python manage.py makemigrations sonoraAPI
python manage.py migrate
```

---

## 5. Criar Administrador

```bash
python manage.py createsuperuser
```

O terminal pedirá:

* nome de usuário
* e-mail
* senha

A senha não aparece enquanto você digita por segurança.

---

## 6. Iniciar o servidor

```bash
python manage.py runserver
```

---

# 🤖 Testando com o Script JS (Windows)

Se você estiver usando o VS Code no Windows:

## 1. Instalar Node.js

Baixe a versão LTS em:

* [https://nodejs.org/](https://nodejs.org/)

---

## 2. Preparar o ambiente

Abra o terminal na pasta do projeto e rode:

```powershell
npm init -y
npm install dotenv node-fetch
```

---

## 3. Executar o script

```powershell
node example.get_users.js
```

---

# ⚠️ Dicas de Problemas Comuns no Windows

### Comando `python` não encontrado

No Windows, o comando pode estar mapeado como `py` em vez de `python`.

Tente:

```powershell
py -m venv venv
```

---

### Permissões de Script

O Windows é rigoroso com scripts.

Se ao tentar ativar o `venv` você vir um erro sobre scripts desabilitados:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

---

### Caminhos

Ao configurar o `MEDIA_ROOT` no `settings.py`, prefira:

```python
BASE_DIR / "media"
```

Evite caminhos absolutos como:

```text
C:\Users\...
```

---

### Banco de Dados

O SQLite funciona perfeitamente no Windows sem precisar instalar nenhum servidor externo.

Caso deseje migrar futuramente para MySQL, recomenda-se utilizar:

* Docker
* XAMPP

---

# 🔌 Como consumir a API

A API segue o padrão RESTful.

Base URL:

```text
/api/sonora/v1/
```

---

# 🔐 Autenticação

## Login

### Endpoint

```http
POST /api/sonora/v1/token/
```

### Descrição

Envia `username` e `password` e retorna os tokens JWT (`access` e `refresh`).

---

## Refresh Token

### Endpoint

```http
POST /api/sonora/v1/token/refresh/
```

### Descrição

Recebe o token `refresh` e retorna um novo token `access`.

---

## Cabeçalho JWT

Para acessar endpoints protegidos:

```http
Authorization: Bearer <seu_access_token>
```

---

# 📚 Recursos (Endpoints principais)

| Método | Endpoint                           | Descrição                                |
| :----- | :--------------------------------- | :--------------------------------------- |
| `GET`  | `/api/sonora/v1/users/`            | Lista usuários (Admin apenas).           |
| `POST` | `/api/sonora/v1/users/`            | Cria usuários/gerentes (Admin apenas).   |
| `GET`  | `/api/sonora/v1/musics/`           | Lista músicas do usuário logado.         |
| `POST` | `/api/sonora/v1/musics/`           | Cria uma nova música.                    |
| `GET`  | `/api/sonora/v1/events/`           | Lista eventos futuros.                   |
| `POST` | `/api/sonora/v1/events/`           | Cria um novo evento.                     |
| `POST` | `/api/sonora/v1/link_event_music/` | Vincula música a evento.                 |
| `POST` | `/api/sonora/v1/renew_plan/`       | Atualiza o plano do usuário autenticado. |
| `GET`  | `/api/sonora/v1/ping/`             | Verifica se a API está online.           |

---

# 🤖 Testando com o Script JS

Se você deseja testar a comunicação programaticamente, use o script:

```text
example.get_users.js
```

---

## 1. Instalar dependências

```bash
npm init -y
npm install dotenv node-fetch
```

---

## 2. Configurar `.env`

Crie um `.env` com:

```env
API_URL=
API_USERNAME=
API_PASSWORD=
```

---

## 3. Executar

```bash
node example.get_users.js
```

---

# 💡 Regras de Negócio Importantes

## Deleção Segura

Não existe deleção física (Hard Delete).

Ao deletar via API, o sistema apenas altera:

```python
is_active = False
```

---

## Filtro de Eventos

Gerentes apenas visualizam eventos cuja data:

```python
end_date >= hoje
```

---

## Permissões

### Admin

* acesso total

### Gerente (Staff)

* pode gerenciar eventos vinculados a ele

### Usuário comum

* acesso restrito ao próprio perfil e músicas vinculadas

---

# 🧩 Estrutura de Dados

Consulte o arquivo:

```text
models.py
```

para visualizar os campos exatos de cada recurso.

---

# 📌 Fluxo de Uso

* Administrador cria gerente.
  (POST: `/api/sonora/v1/users/`)

![alt text](docs/images/adm-cria-gerente.png)

---

* Gerente faz login.
  (POST: `/api/sonora/v1/token/`)

![alt text](docs/images/adm-cria-gerente.png)

---

* Gerente adiciona música.
  (POST: `/api/sonora/v1/musics/`)

![alt text](docs/images/gerente-adiciona-musica.png)

---

* Gerente cria evento.
  (Por padrão, o evento criado é vinculado ao gerente que o criou.)

(POST: `/api/sonora/v1/events/`)

![alt text](docs/images/gerente-cria-evento.png)

---

* Vínculo entre músicas e evento.
  (POST: `/api/sonora/v1/link_event_music/`)

![alt text](docs/images/link-entre-evento-e-musica.png)

---

* Informações do próprio usuário.
  (GET: `/api/sonora/v1/users/`)

```json
[
  {
    "id": "c05895aa-2076-43c6-8c99-1af99e71f4f0",
    "username": "manager",
    "email": "",
    "plan": {
      "id": 40,
      "created_at": "2026-05-09T18:39:40.983619Z",
      "updated_at": "2026-05-09T18:39:40.983662Z",
      "name": "anual",
      "start_date": "2026-05-09T18:39:40.983412Z",
      "end_date": "2027-05-09T18:39:40.983412Z"
    },
    "is_manager": true,
    "is_admin": false,
    "is_staff": false,
    "my_events": [
      {
        "id": "0ccfe802-b33f-4989-94a7-0ccb8ff26811",
        "event_id": "78382c59-ac0c-4292-85f6-1af4c702f809",
        "music_id": "a3e58d2b-7c85-41ff-8098-5efe7d144813",
        "event_name": "Festa de 115",
        "music_name": "Exemplo musical",
        "url": "https://music.com"
      }
    ],
    "my_sounds": [
      {
        "created_at": "2026-05-09T18:45:05.001802Z",
        "updated_at": "2026-05-09T18:45:05.001836Z",
        "id": "e0411112-0420-4a47-a112-2d1a1611a97a",
        "name": "Exemplo musical",
        "url": "https://musics.com",
        "user_id": "c05895aa-2076-43c6-8c99-1af99e71f4f0",
        "observation": null,
        "is_active": true
      }
    ]
  }
]
```

---

# 🗄️ Database

## Diagrama de entidades (DBML)

[https://dbdiagram.io/](https://dbdiagram.io/)

```dbml
Table plans {
  id integer [pk, increment]
  name varchar(50) [not null]
  start_date datetime
  end_date datetime
  created_at datetime [not null]
  updated_at datetime [not null]
}

Table users {
  id uuid [pk]
  username varchar(150) [not null]
  password varchar(128) [not null]
  first_name varchar(150)
  last_name varchar(150)
  email varchar(254)
  is_staff boolean [default: false]
  is_superuser boolean [default: false]
  is_active boolean [default: true]

  plan_id integer [ref: > plans.id]
  is_admin boolean [default: false]
  is_manager boolean [default: false]
}

Table youtube_musics {
  id uuid [pk]
  name varchar(100) [not null]
  url varchar(255) [not null]
  user_id uuid [ref: > users.id]
  observation varchar(255)
  is_active boolean [default: true]
  created_at datetime [not null]
  updated_at datetime [not null]

  indexes {
    (name, url) [unique]
  }
}
```

---

## SQL

```sql
CREATE DATABASE IF NOT EXISTS sonoradb;
USE sonoradb;

CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

