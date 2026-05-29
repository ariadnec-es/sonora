import { apiFetch } from './api'
import type { ApiMusic } from '../types/api'

// ─── Listar músicas ────────────────────────────────────────────────────────────

export async function fetchMusics(): Promise<ApiMusic[]> {
  return apiFetch<ApiMusic[]>('/musics/')
}

// ─── Criar música ──────────────────────────────────────────────────────────────

export interface CreateMusicPayload {
  name: string
  url?: string
  singer?: string
  duration?: string
  observation?: string
}

export async function createMusic(payload: CreateMusicPayload): Promise<ApiMusic> {
  return apiFetch<ApiMusic>('/musics/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Atualizar música ──────────────────────────────────────────────────────────

export async function updateMusic(
  id: string,
  payload: Partial<CreateMusicPayload>,
): Promise<ApiMusic> {
  return apiFetch<ApiMusic>(`/musics/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Deletar música (soft delete) ─────────────────────────────────────────────

export async function deleteMusic(id: string): Promise<void> {
  return apiFetch<void>(`/musics/${id}/`, { method: 'DELETE' })
}
