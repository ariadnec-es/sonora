export interface EventItem {
  id: number
  apiId?: string          // UUID do backend
  name: string
  organizer: string
  date: string
  status: 'ativo' | 'inativo'
  musicCount: number
  project?: string
}
