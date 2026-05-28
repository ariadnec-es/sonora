export type MusicType = 'fundo' | 'reacao' | 'geral'

export interface MusicItem {
  id: number
  order: number
  artist: string
  title: string
  youtubeLink: string
  notes: string
  type: MusicType
  thumbnail: string
  favorite: boolean
  folderId: number | null
  eventId: number | null
  project?: string
  createdAt: string
}
