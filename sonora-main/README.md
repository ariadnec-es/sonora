## Como rodar o projeto

### 1. Pré-requisitos
- Node.js instalado
- npm instalado
- Git instalado

### 2. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/SONORA.git
cd SONORA
```

### 3. Instale as dependências
```bash
npm install
```

### 4. Variáveis de ambiente
Este projeto atual funciona como um front-end React/Vite e **não precisa de `.env` nem de banco de dados** para rodar localmente.
Os dados são salvos no navegador com `localStorage`.

### 5. Inicie o projeto
```bash
npm run dev
```

### 6. Acesse no navegador
A aplicação roda normalmente em:
- `http://localhost:5173`

### 7. Login padrão
O projeto já vem com um usuário administrativo local:
- Email: `admin@admin`
- Senha: `admin`

### 8. Build de produção (opcional)
```bash
npm run build
npm run preview
```

### 9. Possíveis erros comuns
- Se aparecer erro de dependências, rode `npm install` novamente.
- Se a porta `5173` estiver ocupada, use outro port com `npm run dev -- --host 0.0.0.0 --port 3000`.
- Se o projeto não abrir, rode `npm run build` para verificar se o código compila.
