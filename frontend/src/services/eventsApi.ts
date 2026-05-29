import { apiFetch } from './api'
import type { ApiEvent } from '../types/api'

// ─── Listar eventos ────────────────────────────────────────────────────────────

export async function fetchEvents(): Promise<ApiEvent[]> {
  return apiFetch<ApiEvent[]>('/events/')
}

// ─── Criar evento ──────────────────────────────────────────────────────────────

export interface CreateEventPayload {
  event_name: string
  start_date: string
  end_date: string
  location?: string
  manager?: string | null
}

export async function createEvent(payload: CreateEventPayload): Promise<ApiEvent> {
  return apiFetch<ApiEvent>('/events/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── Atualizar evento ──────────────────────────────────────────────────────────

export async function updateEvent(
  id: string,
  payload: Partial<CreateEventPayload>,
): Promise<ApiEvent> {
  return apiFetch<ApiEvent>(`/events/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

// ─── Deletar evento (soft delete) ─────────────────────────────────────────────

export async function deleteEvent(id: string): Promise<void> {
  return apiFetch<void>(`/events/${id}/`, { method: 'DELETE' })
}
