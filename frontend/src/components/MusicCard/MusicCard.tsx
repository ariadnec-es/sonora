import type { MusicItem } from '../../types/music'

interface MusicCardProps {
  music: MusicItem
  showFolder?: boolean
  canManage?: boolean
  onEdit: (music: MusicItem) => void
  onDelete: (id: number) => void
  onToggleFavorite: (id: number) => void
  onPlay: (music: MusicItem) => void
  onMoveType: (id: number, type: 'fundo' | 'reacao' | 'geral') => void
  onDragStart?: (id: number) => void
  onDrop?: (id: number) => void
}

function getTypeBadge(type: MusicItem['type']) {
  const map = {
    fundo: 'Fundo',
    reacao: 'Reação',
    geral: 'Geral',
  }

  return map[type]
}

export default function MusicCard({
  music,
  showFolder = false,
  canManage = true,
  onEdit,
  onDelete,
  onToggleFavorite,
  onPlay,
  onMoveType,
  onDragStart,
  onDrop,
}: MusicCardProps) {
  return (
    <article
      className="music-row-card"
      draggable
      onDragStart={() => onDragStart?.(music.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop?.(music.id)}
    >
      <img src={music.thumbnail} alt={music.title} className="music-row-thumb" />

      <div className="music-row-content">
        <div className="music-row-topline">
          <span className="music-order">#{music.order}</span>
          <span className={`music-type-badge ${music.type}`}>{getTypeBadge(music.type)}</span>
        </div>

        <h3>{music.title}</h3>
        <p className="music-row-artist">{music.artist}</p>
        <p className="music-row-notes">{music.notes || 'Sem observações adicionais.'}</p>

        <div className="music-row-meta">
          <span>{music.favorite ? 'Favoritado' : 'Normal'}</span>
          {showFolder && <span>Pasta: {music.folderId ? `#${music.folderId}` : 'Sem pasta'}</span>}
        </div>
      </div>

      <div className="music-row-actions">
        {canManage && (
          <>
            <button type="button" className="btn-secondary" onClick={() => onEdit(music)}>
              Editar
            </button>
            <button type="button" className="btn-danger" onClick={() => onDelete(music.id)}>
              Excluir
            </button>
          </>
        )}
        <button type="button" className="btn-secondary" onClick={() => onToggleFavorite(music.id)}>
          {music.favorite ? 'Remover favorito' : 'Favoritar'}
        </button>
        <button type="button" className="btn-primary" onClick={() => onPlay(music)}>
          Play
        </button>
        {canManage && music.type === 'fundo' && (
          <button type="button" className="btn-secondary" onClick={() => onMoveType(music.id, 'reacao')}>
            Mover para Reações
          </button>
        )}
        {canManage && music.type === 'reacao' && (
          <button type="button" className="btn-secondary" onClick={() => onMoveType(music.id, 'fundo')}>
            Mover para Fundo
          </button>
        )}
      </div>
    </article>
  )
}
