# 🎵 Documentação do Projeto SonoraAPI

Bem-vindo à documentação do backend do projeto Sonora.

## 🏗️ Arquitetura do Sistema

A API foi construída baseada no padrão RESTful utilizando a stack **Django** + **Django REST Framework (DRF)**. Os principais componentes e padrões da arquitetura incluem:

*   **Autenticação:** Utiliza **JWT (JSON Web Tokens)** garantindo autenticação state-less (endpoints `/token/` e `/token/refresh/`).
*   **Identificadores:** Utiliza **UUIDs** como chaves primárias, impedindo ataques de enumeração e previsibilidade de recursos.
*   **Camada Base (`BaseViewSet`):** Os recursos principais herdam de um `BaseViewSet` customizado que centraliza as regras de negócio vitais do sistema:
    *   **Soft Delete:** O método `perform_destroy` sobrescreve a deleção do DRF, aplicando `is_active = False` nos registros ao invés do Hard Delete.
    *   **Filtros Inteligentes:** Auto-filtragem de registros ativos e sanitização dos `query_params`.
    *   **Autorização Baseada em Papéis:** Métodos auxiliares (`is_admin`, `is_manager`, `can_delete`) resolvem o acesso aos dados em tempo de execução de acordo com o cargo do usuário.
*   **Validação de Assinatura (`HasValidPlanPermission`):** Camada adicional de permissão que intercepta as chamadas à API, garantindo que as operações sejam efetuadas apenas se a assinatura (`Plan`) do usuário estiver com o `end_date` vigente.

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

# 📚 Rotas do Sistema e Permissões

A API segue o padrão RESTful para os ViewSets, fornecendo os métodos padrão (GET, POST, PUT, PATCH, DELETE) nos respectivos endpoints. Todas as rotas base são interceptadas pelo `HasValidPlanPermission` e `IsAuthenticated` (exceto `/token/` e `/ping/`).

### 1. Autenticação e Utilitários

| Rota / Endpoint | Método | Função | Permissões / Regras de Acesso |
| :--- | :--- | :--- | :--- |
| `/api/sonora/v1/token/` | `POST` | Login na API. | **Público**. Retorna os tokens `access` e `refresh`. |
| `/api/sonora/v1/token/refresh/` | `POST` | Renova token de acesso. | **Público**. Recebe o `refresh` token antigo. |
| `/api/sonora/v1/ping/` | `GET` | Healthcheck do servidor. | **Público**. Verifica se a API está de pé. |
| `/api/sonora/v1/renew_plan/` | `POST` | Renovação do plano atual. | **Usuário autenticado**. Apenas permite a renovação se o plano anterior estiver expirado. |

### 2. Recursos e ViewSets (DRF)

As tabelas a seguir detalham as permissões específicas para cada recurso por grupo de acesso (Admin, Gerente/Manager, Usuário).

#### 👤 Users (`/api/sonora/v1/users/`)
| Nível de Acesso | Leitura (`GET`) | Criação (`POST`) | Edição / Deleção (`PUT`, `PATCH`, `DELETE`) |
| :--- | :--- | :--- | :--- |
| **Admin** | Acesso total a todos os usuários. | Permissão de criação de usuários e gerentes. | Acesso total, incluindo permissão exclusiva de Deleção (Soft). |
| **Gerente** | Visualiza apenas o próprio perfil. | ⛔ Negado | Permissão de edição do próprio perfil. (⛔ Deleção Negada). |
| **Usuário** | Visualiza apenas o próprio perfil. | ⛔ Negado | Permissão de edição do próprio perfil. (⛔ Deleção Negada). |

#### 🎵 Músicas (YoutubeMusic) (`/api/sonora/v1/musics/`)
| Nível de Acesso | Leitura (`GET`) | Criação (`POST`) | Edição / Deleção (`PUT`, `PATCH`, `DELETE`) |
| :--- | :--- | :--- | :--- |
| **Admin** | Acesso total a todas as músicas. | Criação irrestrita. | Acesso total a qualquer música. |
| **Gerente** | Suas próprias músicas e as músicas vinculadas aos seus eventos. | Pode criar (vão pertencer a ele mesmo). | Pode editar/deletar apenas as suas próprias músicas. |
| **Usuário** | Apenas as suas próprias músicas. | Pode criar (vão pertencer a ele mesmo). | Pode editar/deletar apenas as suas próprias músicas. |

#### 📅 Eventos (`/api/sonora/v1/events/`)
| Nível de Acesso | Leitura (`GET`) | Criação (`POST`) | Edição / Deleção (`PUT`, `PATCH`, `DELETE`) |
| :--- | :--- | :--- | :--- |
| **Admin** | Acesso total a todos os eventos. | Criação irrestrita. | Acesso total a qualquer evento. |
| **Gerente** | Apenas os próprios eventos vinculados a ele cujo `end_date >= hoje`. | Pode criar eventos (tornando-se o manager). | Pode editar/deletar apenas seus eventos que ainda não expiraram. |
| **Usuário** | ⛔ Negado | ⛔ Negado | ⛔ Negado |

#### 🔀 Ordem de Músicas do Evento (MusicOrder) (`/api/sonora/v1/music-order/`)
*Substitui a antiga rota `link_event_music`.*

| Nível de Acesso | Leitura (`GET`) | Criação (`POST`) | Edição / Deleção (`PUT`, `PATCH`, `DELETE`) |
| :--- | :--- | :--- | :--- |
| **Admin** | Acesso total. | Criação irrestrita. | Acesso total. |
| **Gerente** | Apenas ligações de músicas de eventos que ele gerencia. | Pode adicionar suas próprias músicas aos seus eventos (desde que ativos). | Pode alterar/deletar ligações dos seus eventos não expirados. |
| **Usuário** | ⛔ Negado | ⛔ Negado | ⛔ Negado |

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

## 🔐 Resumo do Controle de Acesso Baseado em Papéis (RBAC)

A API utiliza uma abordagem rígida de permissões. A base de segurança garante que:
1. **Isolamento de Tenant Parcial:** Os usuários comuns nunca enxergam dados de outros usuários. Suas requisições limitam-se restritamente ao que são donos (Owner).
2. **Ciclo de Vida de Eventos:** Gerentes (Managers) perdem capacidade de alteração ou inserção de dados em Eventos (e suas Músicas vinculadas) assim que a data atual ultrapassa o encerramento do evento (`end_date`).
3. **Plano Obrigatório:** Nenhuma das regras acima é alcançada se o `Plan` do usuário estiver expirado no momento da requisição.

