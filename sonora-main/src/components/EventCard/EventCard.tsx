import type { EventItem } from '../../types/event'

interface EventCardProps {
  event: EventItem
  canManage?: boolean
  onEdit: (event: EventItem) => void
  onDelete: (id: number) => void
  onOpen: (event: EventItem) => void
}

export default function EventCard({ event, canManage = true, onEdit, onDelete, onOpen }: EventCardProps) {
  return (
    <article className="event-card">
      <div className="event-card-header">
        <div>
          <p className="event-status-pill">{event.status}</p>
          <h3>{event.name}</h3>
        </div>
      </div>

      <div className="event-card-meta">
        <p><strong>Organizador:</strong> {event.organizer}</p>
        <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Músicas:</strong> {event.musicCount}</p>
      </div>

      <div className="event-actions-grid">
        {canManage && (
          <>
            <button type="button" className="btn-secondary" onClick={() => onEdit(event)}>
              Editar
            </button>
            <button type="button" className="btn-danger" onClick={() => onDelete(event.id)}>
              Excluir
            </button>
          </>
        )}
        <button type="button" className="btn-primary" onClick={() => onOpen(event)}>
          Abrir Evento
        </button>
      </div>
    </article>
  )
}
