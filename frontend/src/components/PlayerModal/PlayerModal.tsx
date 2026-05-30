interface PlayerModalProps {
  open: boolean
  onClose: () => void
  youtubeLink: string
  title: string
}

export default function PlayerModal({ open, onClose, youtubeLink, title }: PlayerModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="player-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-kicker">Player</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="player-frame-wrap">
          <iframe
            className="player-frame"
            src={youtubeLink}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
