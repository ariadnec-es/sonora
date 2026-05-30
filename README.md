# Projeto de Engenharia de Software

## Índice
* [Sobre o Projeto](#sobre-o-projeto)
* [Como clonar ou baixar](#como-clonar-ou-baixar)
* [Estrutura do Projeto](#estrutura-do-projeto)
* [Licença](#licença)

## Sobre o Projeto
### Título: `Sonora`

### Descrição

- Gerenciador e reprodutor de áudio para organização de eventos.

### Componentes

- Ariadne Silva

- Arthur Queiroz

- Cassio Costa

- Vitor Rayan

- Victor Silva

## Como clonar ou baixar
- Você pode obter este repositório de três formas:

### Clonar via HTTPS
```bash 
git clone https://github.com/ariadnec-es/sonora.git
```
- Isso criará uma cópia local do repositório em sua máquina.

### Clonar via SSH
- Se você já configurou sua chave SSH no GitHub, pode clonar usando:

```bash
git clone git@github.com:ariadnec-es/sonora.git
```

- Isso criará uma cópia local do repositório em sua máquina.

### Baixar como ZIP

- Acesse a página do repositório no GitHub: https://github.com/ariadnec-es/sonora

- Clique no botão Code (verde).

- Selecione Download ZIP.

- Extraia o arquivo ZIP para o local desejado em seu computador.

### Stack de tecnologia do Projeto

- **Backend** (API REST): 
    - Python 3.12
    - Django 5.2.14
    - Django Rest FrameWork 3.17.1
    - Django simple JWT 5.5.1

- **Frontend** (React)
    - TypeScript 6
    - React 19
    - Vite 8
    - React Hot Toast 
    - React Icons 
    - ESLint 


## Sprint 2

### Testes
---

- Testes de Integração de API, utilizando uma classe base de Setup (BaseTestSetup) herdando do cliente de testes do Django REST Framework (APITestCase).

- Validação de plano e renovação de plano (condição de acesso: ter plano ativo).
```python
class TestPlanMiddlewareAndRenewal(BaseTestSetup):
    ...
```

-  Login criação de eventos e permissões.
```python
class TestViewPermissions(BaseTestSetup):
    ...
```

- Ordenação de musicas, músicas adicionadas seguem corretamente a ordenação.
```python
class TestMusicOrderLogic(BaseTestSetup):
```

![alt text](images/doc/sprint2/teste-image.png)


### MVP
---

- Login: Pessoa já cadastrada realiza login

![alt text](images/doc/sprint2/login.png)

- Criar evento: Usuário com status de administrador cria evento

![alt text](images/doc/sprint2/novo-evento.png)

- Adicionar música: Adiciona música (url do youtube) via interface

![alt text](images/doc/sprint2/adicionar-musica.png)

- Aceitar música para evento: declina ou aceita música

![alt text](images/doc/sprint2/aceitar-musica.png)