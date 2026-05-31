import React from 'react'
import { FaPlay, FaStar, FaRegStar, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa'
import type { MusicItem, MusicType } from '../../types/music'

interface MusicCardProps {
  music: MusicItem
  eventName?: string
  canManage?: boolean
  onEdit: (music: MusicItem) => void
  onDelete: (id: number) => void
  onToggleFavorite: (id: number) => void
  onPlay: (music: MusicItem) => void
  onMoveType: (id: number, type: MusicType) => void
  onStatusChange: (id: number, status: 'pending' | 'accepted' | 'rejected') => void
  onDragStart?: (id: number) => void
  onDrop?: (id: number) => void
}

export default function MusicCard({
  music,
  eventName,
  canManage = false,
  onEdit,
  onDelete,
  onToggleFavorite,
  onPlay,
  onMoveType,
  onStatusChange,
  onDragStart,
  onDrop,
}: MusicCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) onDragStart(music.id)
    e.dataTransfer.setData('text/plain', music.id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDrop) onDrop(music.id)
  }

  return (
    <article
      className="music-row-card"
      draggable={canManage}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img src={music.thumbnail} alt={music.title} className="music-row-thumb" />

      <div className="music-row-content">
        <div className="music-row-topline">
          <span className="music-order">#{music.order}</span>
          <span className={`music-type-badge ${music.type}`}>{music.type}</span>
          <span className={`event-status-pill ${music.status}`}>
            {music.status === 'pending' ? 'Pendente' : music.status === 'accepted' ? 'Aceita' : 'Recusada'}
          </span>
          <h3>{music.title}</h3>
        </div>
        <p className="music-row-artist">{music.artist}</p>
        {music.notes && <p className="music-row-notes">{music.notes}</p>}
        {eventName && <p className="music-row-meta">Evento: {eventName}</p>}
        <div className="music-row-link">
          <a href={music.youtubeLink} target="_blank" rel="noopener noreferrer">
            {music.youtubeLink}
          </a>
        </div>
      </div>

      <div className="music-row-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onPlay(music)}
          title="Play"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaPlay /> Play
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => onToggleFavorite(music.id)}
          title={music.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          {music.favorite ? <FaStar color="#f59e0b" /> : <FaRegStar />}
        </button>

        {canManage && (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onEdit(music)}
              title="Editar"
            >
              <FaEdit />
            </button>

            {music.status !== 'accepted' && (
              <button
                type="button"
                className="btn-secondary"
                style={{ color: '#22c55e' }}
                onClick={() => onStatusChange(music.id, 'accepted')}
                title="Aceitar"
              >
                <FaCheck />
              </button>
            )}
            {music.status !== 'rejected' && (
              <button
                type="button"
                className="btn-secondary"
                style={{ color: '#f43f5e' }}
                onClick={() => onStatusChange(music.id, 'rejected')}
                title="Recusar"
              >
                <FaTimes />
              </button>
            )}

            <div className="toolbar-stack" style={{ gap: '4px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onMoveType(music.id, 'fundo')}
                title="Mover para Fundo"
                style={{ fontSize: '0.6rem', padding: '4px 8px', background: music.type === 'fundo' ? 'rgba(139, 92, 246, 0.3)' : '' }}
              >
                Fundo
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onMoveType(music.id, 'reacao')}
                title="Mover para Reação"
                style={{ fontSize: '0.6rem', padding: '4px 8px', background: music.type === 'reacao' ? 'rgba(139, 92, 246, 0.3)' : '' }}
              >
                Reação
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onMoveType(music.id, 'geral')}
                title="Mover para Geral"
                style={{ fontSize: '0.6rem', padding: '4px 8px', background: music.type === 'geral' ? 'rgba(139, 92, 246, 0.3)' : '' }}
              >
                Geral
              </button>
            </div>

            <button
              type="button"
              className="btn-danger"
              onClick={() => onDelete(music.id)}
              title="Excluir"
            >
              <FaTrash />
            </button>
          </>
        )}
      </div>
    </article>
  )
}
