export type MusicType = 'fundo' | 'reacao' | 'geral'

export interface MusicItem {
  id: number
  apiId?: string          // UUID do YoutubeMusic no backend
  orderApiId?: string     // UUID do MusicOrder no backend
  order: number
  artist: string
  title: string
  youtubeLink: string
  notes: string
  type: MusicType
  status: 'pending' | 'accepted' | 'rejected'
  thumbnail: string
  favorite: boolean
  folderId: number | null
  eventId: number | null
  project?: string
  createdAt: string
}
