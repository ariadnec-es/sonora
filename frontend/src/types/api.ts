/**
 * Tipos que espelham os modelos do backend Django (SonoraAPI).
 */

// ─── Plano ────────────────────────────────────────────────────────────────────

export type PlanName = 'mensal' | 'anual' | 'experimentacao'

export interface Plan {
  id: string
  name: PlanName
  start_date: string
  end_date: string
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string
  username: string
  email: string
  plan: Plan | null
  is_manager: boolean
  is_admin: boolean
  is_staff: boolean
  my_events: ApiEventWithMusics[]
  my_sounds: ApiMusic[]
}

// ─── Evento ───────────────────────────────────────────────────────────────────

export interface ApiEvent {
  id: string
  event_name: string
  start_date: string
  end_date: string
  location?: string
  is_active: boolean
  manager: string | null
  manager_username?: string
}

export interface ApiEventWithMusics {
  event_id: string
  event_name: string
  event_start_date: string
  event_end_date: string
  musics: ApiMusicInEvent[]
  folders: ApiFolder[]
}

export interface ApiMusicInEvent {
  id: string           // MusicOrder id
  music_id: string
  name: string
  url: string | null
  file: string | null
  singer: string | null
  duration: string | null
  order: number
  status: 'pending' | 'accepted' | 'rejected'
  category: 'interactive' | 'background'
  folder: string | null
}

// ─── Música ───────────────────────────────────────────────────────────────────

export interface ApiMusic {
  id: string
  name: string
  url: string | null
  file: string | null
  user: string | null
  observation: string | null
  singer: string | null
  duration: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── MusicOrder ───────────────────────────────────────────────────────────────

export type MusicStatus = 'pending' | 'accepted' | 'rejected'
export type MusicCategory = 'interactive' | 'background'

export interface ApiMusicOrder {
  id: string
  music: string
  event: string
  order: number
  status: MusicStatus
  category: MusicCategory
  folder: string | null
  music_details: ApiMusic | null
  event_details: ApiEvent | null
  created_at: string
  updated_at: string
}

// ─── Pasta ────────────────────────────────────────────────────────────────────

export interface ApiFolder {
  id: string
  name: string
  parent: string | null
  event: string
}

// ─── Token ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string
  refresh: string
}
