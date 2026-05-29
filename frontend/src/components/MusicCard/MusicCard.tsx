import type { MusicItem } from '../../types/music'

interface MusicCardProps {
  music: MusicItem
  eventName?: string
  showFolder?: boolean
  canManage?: boolean
  onEdit: (music: MusicItem) => void
  onDelete: (id: number) => void
  onToggleFavorite: (id: number) => void
  onPlay: (music: MusicItem) => void
  onMoveType: (id: number, type: 'fundo' | 'reacao' | 'geral') => void
  onStatusChange?: (id: number, status: 'pending' | 'accepted' | 'rejected') => void
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

function getStatusBadge(status: string) {
  const map = {
    pending: { label: 'Pendente', color: 'var(--color-warning)' },
    accepted: { label: 'Aceita', color: 'var(--color-success)' },
    rejected: { label: 'Rejeitada', color: 'var(--color-error)' },
  }
  return map[status as keyof typeof map] || { label: status, color: 'gray' }
}

export default function MusicCard({
  music,
  eventName,
  showFolder = false,
  canManage = true,
  onEdit,
  onDelete,
  onToggleFavorite,
  onPlay,
  onMoveType,
  onStatusChange,
  onDragStart,
  onDrop,
}: MusicCardProps) {
  const statusInfo = getStatusBadge(music.status || 'pending')

  return (
    <article
      className="music-row-card"
      draggable={canManage}
      onDragStart={() => onDragStart?.(music.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop?.(music.id)}
    >
      <img src={music.thumbnail} alt={music.title} className="music-row-thumb" />

      <div className="music-row-content">
        <div className="music-row-topline">
          <span className="music-order">#{music.order}</span>
          <span className={`music-type-badge ${music.type}`}>{getTypeBadge(music.type)}</span>
          <span className="status-pill" style={{ 
            fontSize: '0.6rem', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            backgroundColor: statusInfo.color + '22', 
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}44`
          }}>
            {statusInfo.label}
          </span>
        </div>

        <h3>{music.title}</h3>
        <p className="music-row-artist">{music.artist}</p>
        <p className="music-row-notes">{music.notes || 'Sem observações adicionais.'}</p>
        
        {music.youtubeLink && (
          <p className="music-row-link">
            <strong>Link:</strong> <a href={music.youtubeLink} target="_blank" rel="noopener noreferrer">{music.youtubeLink}</a>
          </p>
        )}

        <div className="music-row-meta">
          <span><strong>Evento:</strong> {eventName || 'Não vinculado'}</span>
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
            {music.status !== 'accepted' && (
              <button type="button" className="btn-primary" style={{ backgroundColor: 'var(--color-success)' }} onClick={() => onStatusChange?.(music.id, 'accepted')}>
                Aceitar
              </button>
            )}
            {music.status !== 'rejected' && (
              <button type="button" className="btn-danger" onClick={() => onStatusChange?.(music.id, 'rejected')}>
                Recusar
              </button>
            )}
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
