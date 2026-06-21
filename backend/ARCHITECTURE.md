### 1. Visão Geral da Arquitetura

O projeto utiliza um padrão **Model-View-Controller (MVC)** adaptado ao ecossistema Django, onde:
*   **Models:** Definem a estrutura dos dados e regras de negócio (como a lógica de planos e reordenação de músicas).
*   **Serializers:** Transformam instâncias do Django em JSON e validam dados de entrada.
*   **ViewSets (Controllers):** Gerenciam a lógica de requisições HTTP, utilizando uma classe base (`BaseViewSet`) para padronizar segurança e comportamentos.
*   **Middlewares/Autenticação:** Utiliza **JWT (JSON Web Tokens)** para autenticação e um sistema de `permissions` para controle de acesso refinado (Admin, Manager, Usuário comum).

---

### 2. Principais Componentes e Classes

#### **BaseViewSet**
É o coração da API. Centraliza comportamentos repetitivos:
*   **Soft Delete:** O método `perform_destroy` não apaga registros, apenas altera `is_active` para `False`.
*   **Segurança:** Centraliza verificações como `is_admin()`, `is_manager()` e datas de validade (`today()`).
*   **Filtros:** Adiciona automaticamente o filtro `is_active=True` para todos os endpoints.

#### **FolderViewSet**
Gerencia pastas organizacionais dentro de eventos. Permite que Admins vejam todas as pastas, enquanto Managers vejam apenas as pastas de seus respectivos eventos.

#### **MusicOrderViewSet**
Esta é a classe mais complexa devido à lógica de **fila/ordenação**:
*   **`_handle_reordering`**: Um método robusto que, ao inserir ou mover uma música, recalcula automaticamente as posições das outras músicas na lista, deslocando os itens para evitar conflitos de `order`.
*   **Actions (`accept`/`reject`)**: Gerenciam o fluxo de aceitação da música pelo gerente do evento.

#### **YoutubeMusicViewSet**
Gerencia o catálogo de músicas.
*   **Manager**: Pode ver as músicas que ele próprio cadastrou ou as músicas que foram solicitadas por terceiros em seus eventos.
*   **Usuário comum**: Restrito apenas às suas próprias músicas.

#### **UserViewSet**
Gerencia o cadastro e perfil dos usuários.
*   **`me`**: Endpoint rápido para obter os dados do usuário logado.
*   **Criação/Atualização**: Lógica robusta que lida com a atribuição de planos, criação de contas de Manager e vinculação direta de gerentes a eventos (somente para Admins).

---

### 3. Entidades (Models) e Relacionamentos

*   **`User`**: Herda de `AbstractUser`. Possui uma relação 1:1 (implícita pelo plano) com `Plan`. Identifica-se como `is_admin` ou `is_manager`.
*   **`Plan`**: Define a validade do acesso. A lógica de expiração é calculada no `save()` (ex: 2h para experimentação, 30 dias para mensal).
*   **`YoutubeMusic`**: Armazena o link ou arquivo. Possui uma restrição de unicidade (nome + url) para evitar duplicatas.
*   **`Event`**: O objeto central que conecta Gerentes, Pastas e Músicas.
*   **`Folder`**: Organiza as músicas dentro de um evento, permitindo hierarquia (pastas pai/filho).
*   **`MusicOrder`**: A "tabela de junção" inteligente. Vincula uma `Music` a um `Event` com um número de ordem (`order`), status de aprovação e categoria.

---

### 4. Fluxo de Regras de Negócio (Destaques)

1.  **Segurança de Plano:** O `HasValidPlanPermission` garante que, em cada requisição, a API valide se o plano do usuário ainda está ativo comparando `end_date` com `today()`.
2.  **Validação de Eventos:** Não é permitido adicionar ou editar músicas em eventos que já terminaram (`event.end_date < today()`).
3.  **Integridade de Dados:** O uso de `transaction.atomic()` no reordenamento de músicas garante que, se algo falhar durante o deslocamento das ordens, todo o processo seja revertido, mantendo a fila consistente.
4.  **Autenticação:** O sistema utiliza `simplejwt` com tokens de 30 minutos, exigindo renovação via *refresh token* para maior segurança.

### 5. Como estender
*   Ao adicionar novos *ViewSets*, herde sempre de `BaseViewSet`.
*   Para novas regras de acesso, utilize os helpers `self.is_admin()` ou `self.is_manager()` já presentes na classe base.
*   Sempre que precisar alterar a ordem de itens, utilize o padrão de `_handle_reordering` para garantir que o banco de dados não sofra *lock* ou conflito de índices.
