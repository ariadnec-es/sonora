import { useEffect, useState } from 'react'
import type { EventItem } from '../../types/event'
import type { MusicItem, MusicType } from '../../types/music'

interface MusicModalProps {
  open: boolean
  onClose: () => void
  events: EventItem[]
  editingMusic: MusicItem | null
  onSave: (payload: Omit<MusicItem, 'thumbnail' | 'createdAt'> & { id?: number }) => void
}

const emptyState = {
  order: 1,
  artist: '',
  title: '',
  youtubeLink: '',
  notes: '',
  type: 'geral' as MusicType,
  favorite: false,
  folderId: null as number | null,
  eventId: null as number | null,
}

export default function MusicModal({ open, onClose, events, editingMusic, onSave }: MusicModalProps) {
  const [form, setForm] = useState(emptyState)

  useEffect(() => {
    if (editingMusic) {
      setForm({
        order: editingMusic.order,
        artist: editingMusic.artist,
        title: editingMusic.title,
        youtubeLink: editingMusic.youtubeLink,
        notes: editingMusic.notes,
        type: editingMusic.type,
        favorite: editingMusic.favorite,
        folderId: editingMusic.folderId,
        eventId: editingMusic.eventId,
      })
      return
    }

    setForm(emptyState)
  }, [editingMusic, open])

  if (!open) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    onSave({
      id: editingMusic?.id ?? 0,
      ...form,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-kicker">Editor de conteúdo</p>
            <h2>{editingMusic ? 'Editar música' : 'Adicionar música'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Ordem</span>
            <input
              type="number"
              min={1}
              required
              value={form.order}
              onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) || 1 }))}
            />
          </label>

          <label className="field-block">
            <span>Cantor / Artista</span>
            <input
              type="text"
              required
              value={form.artist}
              onChange={(event) => setForm((current) => ({ ...current, artist: event.target.value }))}
            />
          </label>

          <label className="field-block">
            <span>Nome da música</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>

          <label className="field-block">
            <span>Link do YouTube</span>
            <input
              type="url"
              required
              value={form.youtubeLink}
              onChange={(event) => setForm((current) => ({ ...current, youtubeLink: event.target.value }))}
            />
          </label>

          <label className="field-block">
            <span>Observação</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <label className="field-block">
            <span>Tipo da música</span>
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as MusicType }))}
            >
              <option value="geral">Geral</option>
              <option value="fundo">Fundo</option>
              <option value="reacao">Reação</option>
            </select>
          </label>

          <label className="field-block">
            <span>Evento</span>
            <select
              value={form.eventId ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, eventId: event.target.value ? Number(event.target.value) : null }))}
            >
              <option value="">Sem vínculo</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </label>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
