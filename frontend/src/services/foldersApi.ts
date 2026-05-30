import { apiFetch } from './api'
import type { ApiFolder } from '../types/api'

// ─── Listar pastas ─────────────────────────────────────────────────────────────

export async function fetchFolders(eventId?: string): Promise<ApiFolder[]> {
  const query = eventId ? `?event=${eventId}` : ''
  return apiFetch<ApiFolder[]>(`/folders/${query}`)
}

// ─── Criar pasta ───────────────────────────────────────────────────────────────

export interface CreateFolderPayload {
  name: string
  event: string
  parent?: string | null
}

export async function createFolder(payload: CreateFolderPayload): Promise<ApiFolder> {
  return apiFetch<ApiFolder>('/folders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Atualizar pasta ───────────────────────────────────────────────────────────

export async function updateFolder(
  id: string,
  payload: Partial<CreateFolderPayload>,
): Promise<ApiFolder> {
  return apiFetch<ApiFolder>(`/folders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Deletar pasta (soft delete) ──────────────────────────────────────────────

export async function deleteFolder(id: string): Promise<void> {
  return apiFetch<void>(`/folders/${id}/`, { method: 'DELETE' })
}
