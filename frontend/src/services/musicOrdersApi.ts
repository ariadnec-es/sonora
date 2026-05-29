import { apiFetch } from './api'
import type { ApiMusicOrder, MusicCategory, MusicStatus } from '../types/api'

// ─── Listar music orders ───────────────────────────────────────────────────────

export async function fetchMusicOrders(eventId?: string): Promise<ApiMusicOrder[]> {
  const query = eventId ? `?event=${eventId}` : ''
  return apiFetch<ApiMusicOrder[]>(`/music-order/${query}`)
}

// ─── Criar music order ─────────────────────────────────────────────────────────

export interface CreateMusicOrderPayload {
  music: string
  event: string
  order: number
  status?: MusicStatus
  category?: MusicCategory
  folder?: string | null
}

export async function createMusicOrder(payload: CreateMusicOrderPayload): Promise<ApiMusicOrder> {
  return apiFetch<ApiMusicOrder>('/music-order/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Atualizar music order ─────────────────────────────────────────────────────

export async function updateMusicOrder(
  id: string,
  payload: Partial<CreateMusicOrderPayload>,
): Promise<ApiMusicOrder> {
  return apiFetch<ApiMusicOrder>(`/music-order/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Deletar music order (soft delete) ────────────────────────────────────────

export async function deleteMusicOrder(id: string): Promise<void> {
  return apiFetch<void>(`/music-order/${id}/`, { method: 'DELETE' })
}
