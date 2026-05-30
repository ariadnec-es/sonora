/**
 * Cliente HTTP central para a SonoraAPI.
 * - Injeta automaticamente o token JWT em cada requisição.
 * - Renova o access token via refresh quando recebe 401.
 * - Faz logout automático se o refresh também falhar.
 */

const BASE_URL = '/api/sonora/v1'

// ─── Gerenciamento de tokens ────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('loggedUser')
}

// ─── Refresh silencioso ──────────────────────────────────────────────────────

let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processPendingQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  pendingQueue = []
}

async function silentRefresh(): Promise<string> {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('Sem refresh token')

  const response = await fetch(`${BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) throw new Error('Refresh expirado')

  const data = await response.json()
  localStorage.setItem('access_token', data.access)
  return data.access as string
}

// ─── Fetch com retry ─────────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    // Tenta renovar o token
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await silentRefresh()
        isRefreshing = false
        processPendingQueue(null, newToken)
        headers['Authorization'] = `Bearer ${newToken}`
        response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      } catch (err) {
        isRefreshing = false
        processPendingQueue(err, null)
        clearTokens()
        window.dispatchEvent(new Event('sonora:logout'))
        throw err
      }
    } else {
      // Aguarda o refresh em andamento
      const newToken = await new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    }
  }

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      errorBody = await response.text()
    }
    throw { status: response.status, body: errorBody }
  }

  // 204 No Content
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
