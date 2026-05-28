// 🔴 MUDE O "192.168.X.X" PARA O IP DO SEU COMPUTADOR NA REDE
const API_BASE_URL = 'http://192.168.122.1:8000/api/sonora/v1';

async function apiRequest(endpoint, method = 'GET', body = null, authenticated = true) {
  const headers = {};

  if (authenticated) {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Se precisa ser autenticado e não tem token, joga pro login
      window.location.href = 'login.html';
      return;
    }
  }

  const options = {
    method,
    headers: headers,
  };

  if (body) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 401 && authenticated) {
      // Tenta renovar o token usando o refresh_token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('access_token', data.access);
            
            // Refaz a requisição original com o novo token
            headers['Authorization'] = `Bearer ${data.access}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, options);
          } else {
            // Se falhou ao renovar, desloga
            logout();
            return;
          }
        } catch (refreshErr) {
          console.error('Erro ao renovar token:', refreshErr);
          logout();
          return;
        }
      } else {
        logout();
        return;
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Erro na requisição');
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function login(username, password) {
  // Pede o token sem autenticação (por isso mandamos pro fetch direto)
  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error('Falha no login. Verifique suas credenciais.');
  }

  const data = await response.json();

  // Salva tokens
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);

  // Busca dados do usuário (já usa apiRequest, que manda o token)
  const userInfo = await apiRequest('/users/me/');

  localStorage.setItem('user', JSON.stringify(userInfo));

  return userInfo;
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
