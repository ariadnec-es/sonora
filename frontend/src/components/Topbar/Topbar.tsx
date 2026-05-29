import { useState } from 'react'

interface TopbarProps {
  title: string
  subtitle: string
  email: string
  onLogout: () => void
}

export default function Topbar({ title, subtitle, email, onLogout }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const avatarLabel = email ? email.charAt(0).toUpperCase() : 'U'

  return (
    <header className="dashboard-topbar">
      <div>
        <p className="topbar-eyebrow">Painel</p>
        <h2 className="topbar-title">{title}</h2>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>

      <div className="topbar-user-area">
        <div className="topbar-avatar-wrap">
          <button
            type="button"
            className="topbar-avatar"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Abrir menu do usuário"
          >
            {avatarLabel}
          </button>

          {menuOpen && (
            <div className="topbar-user-menu">
              <p className="topbar-user-email">{email}</p>
              <button type="button" className="topbar-logout" onClick={onLogout}>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
