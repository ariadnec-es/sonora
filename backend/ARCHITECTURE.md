# 🏛️ Arquitetura da SonoraAPI

Este documento descreve a arquitetura técnica e as decisões de design implementadas no backend do projeto Sonora.

## 1. Visão Geral
A SonoraAPI é uma plataforma de gerenciamento de músicas e eventos, permitindo que gerentes organizem playlists para eventos específicos. A arquitetura segue o padrão **RESTful** e é construída sobre o ecossistema Django.

## 2. Stack Tecnológica
- **Framework Web:** Django 4.2+
- **API Toolkit:** Django REST Framework (DRF)
- **Autenticação:** JWT (JSON Web Tokens) via `rest_framework_simplejwt`
- **Segurança:** 
  - `django-axes`: Proteção contra ataques de força bruta.
  - Middlewares customizados para validação de planos.
- **Banco de Dados:** SQLite (Protótipo/Desenvolvimento) | Suporte a MySQL/PostgreSQL.
- **Ambiente:** Python 3.12+

## 3. Componentes Principais

### 3.1. Camada de Modelagem (Models)
A API utiliza **UUIDs** como chaves primárias para aumentar a segurança e evitar a enumeração de recursos.

- **User:** Extensão do `AbstractUser` do Django, adicionando papéis (`is_admin`, `is_manager`) e vínculo com um Plano.
- **Plan:** Gerencia assinaturas (Mensal, Anual, Experimentação) com lógica automática de data de expiração no método `save()`.
- **YoutubeMusic:** Armazena referências a músicas do YouTube vinculadas a um usuário.
- **Event:** Representa um evento gerenciado por um `manager`.
- **MusicOrder:** Tabela de junção que vincula músicas a eventos com uma ordem específica (1-30).

### 3.2. Lógica Base (BaseViewSet)
Para garantir consistência e evitar repetição de código (DRY), foi implementada a classe `BaseViewSet` em `sonoraAPI/views.py`. Ela fornece:
- **Soft Delete:** A deleção de registros apenas altera `is_active = False`.
- **Filtros Padrão:** Filtragem automática por `is_active=True`.
- **Helpers de Permissão:** Métodos auxiliares como `is_admin()` e `is_manager()`.

### 3.3. Segurança e Autorização
A autorização é multifacetada:
1.  **JWT Authentication:** Exige um token válido em todas as rotas protegidas.
2.  **Custom Middleware (`MiddleWare`):** Intercepta todas as requisições (exceto rotas livres) para verificar se o plano do usuário ainda é válido.
3.  **Custom Permissions (`Permissions`):**
    - `HasValidPlanPermission`: Verifica a validade do plano no nível do DRF.
    - `IsAdminOrReadOnly`: Restringe operações de escrita apenas para administradores em certos contextos.

## 4. Fluxo de Aplicação

### 4.1. Ciclo de Vida do Plano
1.  **Criação:** Ao criar um usuário, um plano de `Experimentação` (2 horas) é atribuído automaticamente.
2.  **Expiração:** O Middleware e a Permissão bloqueiam o acesso a recursos se a `end_date` do plano for menor que a data atual.
3.  **Renovação:** Usuários podem renovar o plano através do endpoint `/api/sonora/renew_plan/`, que é uma das "rotas livres" no Middleware.

### 4.2. Gerenciamento de Eventos
- Gerentes podem criar eventos e adicionar músicas a eles.
- A API valida se o gerente é o dono do evento e da música antes de permitir o vínculo (`MusicOrder`).
- Eventos passados (baseado na `end_date`) tornam-se somente leitura para gerentes.

## 5. Estrutura de Diretórios
```text
backend/
├── core/                # Configurações globais do Django
│   ├── settings.py      # Configurações, Apps e Middlewares
│   ├── urls.py          # Roteamento global (v1, admin, token)
│   └── middleware.py    # Lógica de interceptação de planos
├── sonoraAPI/           # Aplicação principal
│   ├── models.py        # Definições de dados e lógica de expiração
│   ├── views.py         # ViewSets (BaseViewSet e implementações)
│   ├── serializers.py   # Transformação de dados e campos calculados
│   ├── permissions.py   # Regras de acesso customizadas
│   └── urls.py          # Endpoints da aplicação
└── staticfiles/         # Ativos estáticos para o painel Admin
```

## 6. Padronização de Respostas
A API utiliza `Serializers` do DRF para garantir que as respostas JSON sejam consistentes. O `UserSerializer`, por exemplo, utiliza `SerializerMethodField` para agregar eventos e músicas de forma estruturada em uma única chamada de perfil.
