export interface EventItem {
  id: number
  name: string
  organizer: string
  date: string
  status: 'ativo' | 'inativo'
  musicCount: number
  project?: string
}
