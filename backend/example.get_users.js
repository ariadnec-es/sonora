require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = process.env.API_URL;
const USERNAME = process.env.API_USERNAME;
const PASSWORD = process.env.API_PASSWORD;

async function fetchUsers() {
    try {
        // 1. Obter o Token JWT (usando simple-jwt do Django)
        const tokenResponse = await fetch(`${API_URL}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: USERNAME,
                password: PASSWORD
            })
        });

        if (!tokenResponse.ok) throw new Error('Falha na autenticação');

        const { access } = await tokenResponse.json();
        console.log('Token obtido com sucesso!');

        // 2. Listar usuários usando o Token no Header Authorization
        const usersResponse = await fetch(`${API_URL}/api/sonora/v1/users/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access}`,
                'Content-Type': 'application/json'
            }
        });

        if (!usersResponse.ok) throw new Error('Erro ao buscar usuários');

        const users = await usersResponse.json();
        console.log('Lista de usuários:', users);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

fetchUsers();