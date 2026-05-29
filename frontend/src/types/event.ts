export interface EventItem {
  id: number
  apiId?: string          // UUID do backend
  name: string
  organizer: string
  managerId?: string      // ID do gerente no backend
  startDate: string
  endDate: string
  status: 'ativo' | 'inativo'
  musicCount: number
  project?: string
}
