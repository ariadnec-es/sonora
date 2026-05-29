import type { Dispatch, SetStateAction } from 'react'

export type DashboardTab =
  | 'eventos'
  | 'musicas'
  | 'fundo'
  | 'reacoes'
  | 'pastas'
  | 'favoritos'
  | 'configuracoes'

interface SidebarProps {
  activeTab: DashboardTab
  onSelectTab: Dispatch<SetStateAction<DashboardTab>>
  userEmail: string
}

const menuItems: { key: DashboardTab; label: string }[] = [
  { key: 'eventos', label: 'Eventos' },
  { key: 'musicas', label: 'Músicas' },
  { key: 'fundo', label: 'Música de Fundo' },
  { key: 'reacoes', label: 'Reações' },
  { key: 'pastas', label: 'Pastas' },
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'configuracoes', label: 'Configurações' },
]

export default function Sidebar({ activeTab, onSelectTab, userEmail }: SidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="brand-mark">S</div>
        <div>
          <h1 className="brand-title">SONORA</h1>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {menuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => onSelectTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-chip">
          <span className="sidebar-user-avatar">{userEmail.charAt(0).toUpperCase()}</span>
          <div>
            <p className="sidebar-user-label">Usuário ativo</p>
            <p className="sidebar-user-email">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
