import { apiFetch, setTokens, clearTokens } from './api'
import type { ApiUser, TokenPair } from '../types/api'

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  username: string
  password: string
}

export async function login(payload: LoginPayload): Promise<ApiUser> {
  // 1. Obtém tokens JWT
  const tokens = await apiFetch<TokenPair>('/token/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  setTokens(tokens.access, tokens.refresh)

  // 2. Carrega perfil do usuário autenticado
  const user = await apiFetch<ApiUser>('/users/me/')

  // 3. Persiste dados básicos do usuário no localStorage (para reload)
  localStorage.setItem(
    'loggedUser',
    JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_manager: user.is_manager,
      plan: user.plan,
    }),
  )

  return user
}

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export async function register(payload: RegisterPayload): Promise<ApiUser> {
  return apiFetch<ApiUser>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Me (perfil do usuário logado) ────────────────────────────────────────────

export async function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/users/me/')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function logout() {
  clearTokens()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLoggedUser(): {
  id: string
  username: string
  email: string
  is_admin: boolean
  is_manager: boolean
} | null {
  try {
    const raw = localStorage.getItem('loggedUser')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
