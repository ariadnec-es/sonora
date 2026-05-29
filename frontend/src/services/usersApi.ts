import { apiFetch } from './api'
import type { ApiUser } from '../types/api'

// ─── Listar usuários ──────────────────────────────────────────────────────────

export async function fetchUsers(onlyManagers = false): Promise<ApiUser[]> {
  const query = onlyManagers ? '?managers=true' : ''
  return apiFetch<ApiUser[]>(`/users/${query}`)
}

// ─── Criar usuário (usado por admin para criar gerentes) ───────────────────────

export interface CreateUserPayload {
  username: string
  email: string
  password?: string
  is_manager?: boolean
  is_admin?: boolean
  event_ids?: string[]
}

export async function createUser(payload: CreateUserPayload): Promise<ApiUser> {
  return apiFetch<ApiUser>('/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Atualizar usuário ─────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  payload: Partial<CreateUserPayload>,
): Promise<ApiUser> {
  return apiFetch<ApiUser>(`/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Deletar usuário (soft delete) ───────────────────────────────────────────

export async function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}/`, { method: 'DELETE' })
}
