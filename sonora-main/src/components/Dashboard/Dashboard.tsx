import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import EventCard from '../EventCard/EventCard'
import FolderTree, { type FolderNode } from '../FolderTree/FolderTree'
import MusicCard from '../MusicCard/MusicCard'
import MusicModal from '../MusicModal/MusicModal'
import PlayerModal from '../PlayerModal/PlayerModal'
import Sidebar, { type DashboardTab } from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import { type StoredUser, type UserRole, loadUsers, saveUsers } from '../../services/auth'
import { loadFromStorage, saveToStorage } from '../../services/localStorage'
import type { EventItem } from '../../types/event'
import type { MusicItem } from '../../types/music'
import { buildEmbedUrl, buildThumbnail } from '../../utils/youtube'

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 1,
    name: 'Cerimônia de Abertura',
    organizer: 'Ana Santos',
    date: '2026-06-10',
    status: 'ativo',
    musicCount: 3,
    project: 'Cerimônia de Abertura',
  },
  {
    id: 2,
    name: 'Recepção dos convidados',
    organizer: 'Lucas Mendes',
    date: '2026-06-10',
    status: 'ativo',
    musicCount: 1,
    project: 'Recepção dos convidados',
  },
  {
    id: 3,
    name: 'Espaço de dança',
    organizer: 'Marina Costa',
    date: '2026-06-11',
    status: 'ativo',
    musicCount: 0,
    project: 'Espaço de dança',
  },
]

const DEFAULT_MUSICS: MusicItem[] = [
  {
    id: 1,
    order: 1,
    artist: 'Adele',
    title: 'Hello',
    youtubeLink: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
    notes: 'Entrada principal',
    type: 'fundo',
    thumbnail: buildThumbnail('https://www.youtube.com/watch?v=YQHsXMglC9A'),
    favorite: true,
    folderId: 1,
    eventId: 1,
    project: 'Cerimônia de Abertura',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    order: 2,
    artist: 'The Weeknd',
    title: 'Blinding Lights',
    youtubeLink: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    notes: 'Reação do público',
    type: 'reacao',
    thumbnail: buildThumbnail('https://www.youtube.com/watch?v=4NRXx6U8ABQ'),
    favorite: false,
    folderId: 2,
    eventId: 2,
    project: 'Recepção dos convidados',
    createdAt: new Date().toISOString(),
  },
]

const DEFAULT_FOLDERS: FolderNode[] = [
  {
    id: 1,
    name: 'Abertura',
    parentId: null,
    children: [],
  },
  {
    id: 2,
    name: 'Intervalo',
    parentId: null,
    children: [],
  },
]

interface DashboardProps {
  setScreen: React.Dispatch<React.SetStateAction<'login' | 'register' | 'dashboard'>>
}

const TAB_LABELS: Record<DashboardTab, { title: string; subtitle: string }> = {
  eventos: {
    title: 'Eventos',
    subtitle: 'Gerencie todos os eventos da cerimônia e suas playlists associadas.',
  },
  musicas: {
    title: 'Músicas',
    subtitle: 'Cadastre, filtre e organize as músicas com busca, ordenação e player.',
  },
  fundo: {
    title: 'Música de Fundo',
    subtitle: 'Acompanhe o repertório de ambiente e suas movimentações entre categorias.',
  },
  reacoes: {
    title: 'Reações',
    subtitle: 'Visualize músicas de reação e ajuste rapidamente a categorização.',
  },
  pastas: {
    title: 'Pastas',
    subtitle: 'Organize repertórios em pastas e subpastas com drag and drop.',
  },
  favoritos: {
    title: 'Favoritos',
    subtitle: 'Acesse as músicas preferidas em um espaço dedicado.',
  },
  configuracoes: {
    title: 'Configurações',
    subtitle: 'Ajuste o visual, o nome e a sessão do usuário.',
  },
}

const normalizeText = (value: string) => value.trim().toLowerCase()

const normalizeEventAccess = (values: string[], eventNames: string[]) => {
  return values.filter((value) => eventNames.includes(value))
}

const applyFolderTree = (tree: FolderNode[], parentId: number | null, folder: FolderNode): FolderNode[] => {
  if (parentId === null) {
    return [...tree, folder]
  }

  return tree.map((node) =>
    node.id === parentId
      ? {
          ...node,
          children: [...node.children, folder],
        }
      : {
          ...node,
          children: applyFolderTree(node.children, parentId, folder),
        }
  )
}

const updateFolderTree = (tree: FolderNode[], folderId: number, updater: (folder: FolderNode) => FolderNode): FolderNode[] => {
  return tree.map((node) => {
    if (node.id === folderId) {
      return updater(node)
    }

    return {
      ...node,
      children: updateFolderTree(node.children, folderId, updater),
    }
  })
}

const removeFolderTree = (tree: FolderNode[], folderId: number): FolderNode[] => {
  return tree
    .filter((node) => node.id !== folderId)
    .map((node) => ({
      ...node,
      children: removeFolderTree(node.children, folderId),
    }))
}

export default function Dashboard({ setScreen }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('eventos')
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS)
  const [musics, setMusics] = useState<MusicItem[]>(DEFAULT_MUSICS)
  const [folders, setFolders] = useState<FolderNode[]>(DEFAULT_FOLDERS)
  const [showMusicModal, setShowMusicModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [playerMusic, setPlayerMusic] = useState<MusicItem | null>(null)
  const [editingMusic, setEditingMusic] = useState<MusicItem | null>(null)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'artist'>('order')
  const [filterType, setFilterType] = useState<'all' | 'fundo' | 'reacao'>('all')
  const [draggedMusicId, setDraggedMusicId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('user@sonora.com')
  const [displayName, setDisplayName] = useState('Usuário')
  const [userRole, setUserRole] = useState<UserRole>('cliente')
  const [accessibleEvents, setAccessibleEvents] = useState<string[]>([])
  const [adminUsers, setAdminUsers] = useState<StoredUser[]>([])
  const [adminSelectedEmail, setAdminSelectedEmail] = useState('')
  const [adminSelectedRole, setAdminSelectedRole] = useState<UserRole>('cliente')
  const [adminSelectedProjects, setAdminSelectedProjects] = useState<string[]>([])
  const [showEventChecklist, setShowEventChecklist] = useState(false)
  const [eventForm, setEventForm] = useState({ name: '', organizer: '', date: '' })

  const refreshAdminUsers = () => {
    setAdminUsers(loadUsers())
  }

  useEffect(() => {
    const storedEvents = loadFromStorage<EventItem[]>('sonora_events', [])
    const storedMusics = loadFromStorage<MusicItem[]>('sonora_music', [])
    const storedFolders = loadFromStorage<FolderNode[]>('sonora_folders', [])
    const storedSettings = loadFromStorage<{ displayName: string }>('sonora_settings', { displayName: '' })

    const storedUser = loadFromStorage<{ email: string; displayName?: string; role?: UserRole; projects?: string[] } | null>('loggedUser', null)

    const resolvedEmail = storedUser?.email || localStorage.getItem('userEmail') || 'user@sonora.com'
    const initialEvents = storedEvents.length ? storedEvents : DEFAULT_EVENTS

    setEvents(initialEvents)
    setMusics(storedMusics.length ? storedMusics : DEFAULT_MUSICS)
    setFolders(storedFolders.length ? storedFolders : DEFAULT_FOLDERS)
    setUserEmail(resolvedEmail)
    setDisplayName(storedSettings.displayName || storedUser?.displayName || resolvedEmail.split('@')[0])
    setUserRole(storedUser?.role || 'cliente')
    setAccessibleEvents(normalizeEventAccess(storedUser?.projects || [], initialEvents.map((event) => event.name)))
    refreshAdminUsers()
  }, [])

  useEffect(() => {
    saveToStorage('sonora_events', events)
  }, [events])

  useEffect(() => {
    const syncedMusics = musics.map((music, index) => ({
      ...music,
      order: index + 1,
    }))

    if (JSON.stringify(syncedMusics) !== JSON.stringify(musics)) {
      setMusics(syncedMusics)
      return
    }

    saveToStorage('sonora_music', musics)
  }, [musics])

  useEffect(() => {
    saveToStorage('sonora_folders', folders)
  }, [folders])

  useEffect(() => {
    saveToStorage('sonora_settings', { displayName })
  }, [displayName])

  useEffect(() => {
    setEvents((currentEvents) =>
      currentEvents.map((event) => ({
        ...event,
        musicCount: musics.filter((music) => music.eventId === event.id).length,
      }))
    )
  }, [musics])

  const currentTabInfo = TAB_LABELS[activeTab]
  const currentAccessEvents = useMemo(() => {
    if (userRole === 'admin') {
      return events.map((event) => event.name)
    }

    return normalizeEventAccess(accessibleEvents, events.map((event) => event.name))
  }, [accessibleEvents, events, userRole])

  const visibleEventNames = useMemo(() => {
    if (userRole === 'admin') {
      return events.map((event) => event.name)
    }

    return currentAccessEvents
  }, [currentAccessEvents, events, userRole])

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      if (userRole === 'admin') return true

      return visibleEventNames.includes(event.name)
    })
  }, [events, userRole, visibleEventNames])

  const visibleMusics = useMemo(() => {
    let filtered = musics.filter((music) => {
      const matchesSearch = [music.artist, music.title, music.notes].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )

      const matchesFilter = filterType === 'all' ? true : music.type === filterType

      const matchesTab =
        activeTab === 'fundo'
          ? music.type === 'fundo'
          : activeTab === 'reacoes'
            ? music.type === 'reacao'
            : activeTab === 'favoritos'
              ? music.favorite
              : true

      const musicEventName = music.eventId
        ? events.find((event) => event.id === music.eventId)?.name || music.project
        : music.project

      const matchesEvent = userRole === 'admin' || !musicEventName || visibleEventNames.includes(musicEventName)

      return matchesSearch && matchesFilter && matchesTab && matchesEvent
    })

    filtered = [...filtered].sort((left, right) => {
      if (sortBy === 'title') return left.title.localeCompare(right.title)
      if (sortBy === 'artist') return left.artist.localeCompare(right.artist)
      return left.order - right.order
    })

    return filtered
  }, [activeTab, events, filterType, musics, search, sortBy, userRole, visibleEventNames])

  function openNewEvent() {
    setEditingEventId(null)
    setEventForm({ name: '', organizer: '', date: '' })
    setShowEventModal(true)
  }

  function handleSaveEvent(event: React.FormEvent) {
    event.preventDefault()

    const duplicateEvent = events.some((item) =>
      item.id !== editingEventId &&
      normalizeText(item.name) === normalizeText(eventForm.name) &&
      normalizeText(item.organizer) === normalizeText(eventForm.organizer) &&
      item.date === eventForm.date
    )

    if (duplicateEvent) {
      toast.error('Já existe um evento igual cadastrado.')
      return
    }

    if (editingEventId) {
      setEvents((current) =>
        current.map((item) =>
          item.id === editingEventId
            ? {
                ...item,
                name: eventForm.name,
                organizer: eventForm.organizer,
                date: eventForm.date,
                musicCount: musics.filter((music) => music.eventId === item.id).length,
              }
            : item
        )
      )
      toast.success('Evento atualizado.')
    } else {
      const newEvent: EventItem = {
        id: Date.now(),
        name: eventForm.name,
        organizer: eventForm.organizer,
        date: eventForm.date,
        status: 'ativo',
        musicCount: 0,
      }

      setEvents((current) => [...current, newEvent])
      toast.success('Evento salvo com sucesso.')
    }

    setShowEventModal(false)
    setEventForm({ name: '', organizer: '', date: '' })
    setEditingEventId(null)
  }

  function handleEditEvent(event: EventItem) {
    setEditingEventId(event.id)
    setEventForm({
      name: event.name,
      organizer: event.organizer,
      date: event.date,
    })
    setShowEventModal(true)
  }

  function deleteEvent(id: number) {
    setEvents((current) => current.filter((event) => event.id !== id))
    setMusics((current) => current.map((music) => (music.eventId === id ? { ...music, eventId: null } : music)))
    toast.success('Evento removido.')
  }

  function openEvent(event: EventItem) {
    setActiveTab('musicas')
    setSearch('')
    setFilterType('all')
    setMusics((current) => current.map((music) => (music.eventId === event.id ? music : music)))
    toast.success(`Abrindo músicas de ${event.name}`)
  }

  function handleOpenMusicModal() {
    setEditingMusic(null)
    setShowMusicModal(true)
  }

  function handleMusicSave(payload: Omit<MusicItem, 'thumbnail' | 'createdAt'> & { id?: number }) {
    const duplicateMusic = musics.some((music) =>
      music.id !== payload.id &&
      (music.youtubeLink === payload.youtubeLink ||
        (music.title.toLowerCase() === payload.title.toLowerCase() && music.artist.toLowerCase() === payload.artist.toLowerCase()))
    )

    if (duplicateMusic) {
      toast.error('Essa música já existe no repertório.')
      return
    }

    if (payload.id) {
      setMusics((current) =>
        current.map((music) =>
          music.id === payload.id
            ? {
                ...music,
                ...payload,
                thumbnail: buildThumbnail(payload.youtubeLink),
              }
            : music
        )
      )
      toast.success('Música atualizada.')
    } else {
      const newMusic: MusicItem = {
        ...payload,
        id: Date.now(),
        thumbnail: buildThumbnail(payload.youtubeLink),
        createdAt: new Date().toISOString(),
      }

      setMusics((current) => [...current, newMusic])
      toast.success('Música adicionada ao repertório.')
    }

    setShowMusicModal(false)
    setEditingMusic(null)
  }

  function handleEditMusic(music: MusicItem) {
    setEditingMusic(music)
    setShowMusicModal(true)
  }

  function handleDeleteMusic(id: number) {
    setMusics((current) => current.filter((music) => music.id !== id))
    toast.success('Música removida.')
  }

  function handleToggleFavorite(id: number) {
    setMusics((current) =>
      current.map((music) =>
        music.id === id ? { ...music, favorite: !music.favorite } : music
      )
    )
  }

  function handleMoveType(id: number, type: 'fundo' | 'reacao' | 'geral') {
    setMusics((current) =>
      current.map((music) =>
        music.id === id ? { ...music, type } : music
      )
    )
  }

  function reorderMusics(targetId: number) {
    if (draggedMusicId === null || targetId === draggedMusicId) return

    setMusics((current) => {
      const updated = [...current]
      const fromIndex = updated.findIndex((music) => music.id === draggedMusicId)
      const toIndex = updated.findIndex((music) => music.id === targetId)

      if (fromIndex < 0 || toIndex < 0) return current

      const [draggedMusic] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, draggedMusic)

      return updated.map((music, index) => ({ ...music, order: index + 1 }))
    })

    setDraggedMusicId(null)
  }

  function handleMoveMusic(musicId: number, folderId: number | null) {
    if (musicId <= 0) return

    setMusics((current) =>
      current.map((music) => (music.id === musicId ? { ...music, folderId } : music))
    )
  }

  function handleCreateFolder(parentId: number | null) {
    const name = window.prompt('Nome da pasta')
    if (!name?.trim()) return

    const newFolder: FolderNode = {
      id: Date.now(),
      name: name.trim(),
      parentId,
      children: [],
    }

    setFolders((current) => applyFolderTree(current, parentId, newFolder))
    toast.success('Pasta criada.')
  }

  function handleEditFolder(folder: FolderNode) {
    const name = window.prompt('Editar nome da pasta', folder.name)
    if (!name?.trim()) return

    setFolders((current) =>
      updateFolderTree(current, folder.id, (node) => ({
        ...node,
        name: name.trim(),
      }))
    )
  }

  function handleDeleteFolder(folderId: number) {
    setFolders((current) => removeFolderTree(current, folderId))
    setMusics((current) => current.map((music) => (music.folderId === folderId ? { ...music, folderId: null } : music)))
    toast.success('Pasta removida.')
  }

  function handleAdminAccessSave(event: React.FormEvent) {
    event.preventDefault()

    if (!adminSelectedEmail) {
      toast.error('Selecione um usuário para gerenciar.')
      return
    }

    const lockedAdminUser = adminSelectedEmail === 'admin@admin'
    const normalizedPermissions = normalizeEventAccess(adminSelectedProjects, events.map((event) => event.name))

    const updatedUsers = adminUsers.map((user) =>
      user.email === adminSelectedEmail
        ? {
            ...user,
            role: lockedAdminUser ? 'admin' : adminSelectedRole,
            projects: lockedAdminUser ? events.map((event) => event.name) : normalizedPermissions,
          }
        : user
    )

    saveUsers(updatedUsers)
    setAdminUsers(updatedUsers)

    const selectedUser = updatedUsers.find((user) => user.email === adminSelectedEmail)

    if (selectedUser && selectedUser.email === userEmail) {
      setUserRole(selectedUser.role)
      setAccessibleEvents(selectedUser.projects)

      const updatedLoggedUser = {
        email: selectedUser.email,
        displayName: selectedUser.displayName || selectedUser.email.split('@')[0],
        role: selectedUser.role,
        projects: selectedUser.projects,
      }

      localStorage.setItem('loggedUser', JSON.stringify(updatedLoggedUser))
    }

    toast.success('Permissões atualizadas com sucesso.')
  }

  function handleAdminUserChange(value: string) {
    setAdminSelectedEmail(value)
    setShowEventChecklist(false)

    if (!value) {
      setAdminSelectedRole('cliente')
      setAdminSelectedProjects([])
      return
    }

    const user = adminUsers.find((item) => item.email === value)

    if (user?.email === 'admin@admin') {
      setAdminSelectedRole('admin')
      setAdminSelectedProjects(events.map((event) => event.name))
      return
    }

    setAdminSelectedRole(user?.role ?? 'cliente')
    setAdminSelectedProjects(normalizeEventAccess(Array.isArray(user?.projects) ? user.projects : [], events.map((event) => event.name)))
  }

  const musicSummary = {
    total: visibleMusics.length,
    favorites: visibleMusics.filter((music) => music.favorite).length,
    fundo: visibleMusics.filter((music) => music.type === 'fundo').length,
    reacoes: visibleMusics.filter((music) => music.type === 'reacao').length,
  }

  const canManageMusic = userRole === 'admin' || userRole === 'gerente'

  return (
    <div className="dashboard-shell">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} userEmail={userEmail} />

      <div className="dashboard-main">
        <Topbar
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          email={userEmail}
          onLogout={() => {
            localStorage.removeItem('loggedUser')
            localStorage.removeItem('userEmail')
            setScreen('login')
          }}
        />

        <main className="dashboard-body">
          <section className="dashboard-hero">
            <div>
              <h2></h2>
              <p className="hero-kicker">Central de operação</p>
              <h2>Bem-vindo(a)</h2>
              <p className="hero-copy">Acesse eventos, músicas, pastas e configurações em um ambiente premium e responsivo.</p>
            </div>

            <div className="hero-stats-grid">
              <div className="metric-card">
                <span className="metric-value">{musicSummary.total}</span>
                <span className="metric-label">Músicas</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{musicSummary.favorites}</span>
                <span className="metric-label">Favoritos</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{musicSummary.fundo}</span>
                <span className="metric-label">Fundo</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{musicSummary.reacoes}</span>
                <span className="metric-label">Reações</span>
              </div>
            </div>
          </section>

          {activeTab === 'eventos' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Gestão</p>
                  <h3>Eventos</h3>
                </div>
                {canManageMusic && (
                  <button type="button" className="btn-primary" onClick={openNewEvent}>Novo Evento</button>
                )}
              </div>

              <div className="event-grid">
                {visibleEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    canManage={canManageMusic}
                    onEdit={handleEditEvent}
                    onDelete={deleteEvent}
                    onOpen={openEvent}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'musicas' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Biblioteca</p>
                  <h3>Músicas</h3>
                </div>

                <div className="toolbar-stack">
                  <input
                    type="search"
                    className="toolbar-input"
                    placeholder="Buscar por artista, música ou observações"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  <select className="toolbar-select" value={filterType} onChange={(event) => setFilterType(event.target.value as 'all' | 'fundo' | 'reacao')}>
                    <option value="all">Todos</option>
                    <option value="fundo">Fundo</option>
                    <option value="reacao">Reação</option>
                  </select>

                  <select className="toolbar-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'order' | 'title' | 'artist')}>
                    <option value="order">Ordenar por ordem</option>
                    <option value="title">Ordenar por título</option>
                    <option value="artist">Ordenar por artista</option>
                  </select>

                  {canManageMusic && (
                    <button type="button" className="btn-primary" onClick={handleOpenMusicModal}>Adicionar Música</button>
                  )}
                </div>
              </div>

              <div className="music-list-stack">
                {visibleMusics.map((music) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    canManage={canManageMusic}
                    onEdit={handleEditMusic}
                    onDelete={handleDeleteMusic}
                    onToggleFavorite={handleToggleFavorite}
                    onPlay={(item) => setPlayerMusic(item)}
                    onMoveType={handleMoveType}
                    onDragStart={setDraggedMusicId}
                    onDrop={reorderMusics}
                  />
                ))}

                {visibleMusics.length === 0 && <p className="empty-state">Nenhuma música encontrada.</p>}
              </div>
            </section>
          )}

          {activeTab === 'fundo' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Categorização</p>
                  <h3>Música de Fundo</h3>
                </div>
              </div>

              <div className="music-list-stack">
                {visibleMusics.map((music) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    canManage={canManageMusic}
                    onEdit={handleEditMusic}
                    onDelete={handleDeleteMusic}
                    onToggleFavorite={handleToggleFavorite}
                    onPlay={(item) => setPlayerMusic(item)}
                    onMoveType={handleMoveType}
                    onDragStart={setDraggedMusicId}
                    onDrop={reorderMusics}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'reacoes' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Categorização</p>
                  <h3>Reações</h3>
                </div>
              </div>

              <div className="music-list-stack">
                {visibleMusics.map((music) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    canManage={canManageMusic}
                    onEdit={handleEditMusic}
                    onDelete={handleDeleteMusic}
                    onToggleFavorite={handleToggleFavorite}
                    onPlay={(item) => setPlayerMusic(item)}
                    onMoveType={handleMoveType}
                    onDragStart={setDraggedMusicId}
                    onDrop={reorderMusics}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'pastas' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Organização</p>
                  <h3>Pastas</h3>
                </div>
                <button type="button" className="btn-primary" onClick={() => handleCreateFolder(null)}>Criar pasta</button>
              </div>

              <FolderTree
                folders={folders}
                musics={musics}
                onCreateFolder={handleCreateFolder}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveMusic={handleMoveMusic}
                onPlay={(item) => setPlayerMusic(item)}
                onEditMusic={handleEditMusic}
                onDeleteMusic={handleDeleteMusic}
              />
            </section>
          )}

          {activeTab === 'favoritos' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Preferências</p>
                  <h3>Favoritos</h3>
                </div>
              </div>

              <div className="music-list-stack">
                {visibleMusics.map((music) => (
                  <MusicCard
                    key={music.id}
                    music={music}
                    canManage={canManageMusic}
                    onEdit={handleEditMusic}
                    onDelete={handleDeleteMusic}
                    onToggleFavorite={handleToggleFavorite}
                    onPlay={(item) => setPlayerMusic(item)}
                    onMoveType={handleMoveType}
                    onDragStart={setDraggedMusicId}
                    onDrop={reorderMusics}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'configuracoes' && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Preferências</p>
                  <h3>Configurações</h3>
                </div>
              </div>

              <div className="settings-grid">
                <article className="settings-card">
                  <h4>Acesso atual</h4>
                  <p>Perfil e eventos visíveis para esta conta.</p>
                  <p className="hero-copy">Perfil: {userRole === 'admin' ? 'Administrador' : userRole === 'gerente' ? 'Gerente' : 'Cliente'}</p>
                  <div className="project-chip-list">
                    {(currentAccessEvents.length > 0 ? currentAccessEvents : ['Nenhum evento atribuído']).map((eventName) => (
                      <span key={eventName} className="project-chip">{eventName}</span>
                    ))}
                  </div>
                </article>

                {userRole === 'admin' && (
                  <article className="settings-card">
                    <h4>Administração de acessos</h4>
                    <p>Defina o perfil e os eventos visíveis para cada usuário.</p>
                    <form className="admin-access-form" onSubmit={handleAdminAccessSave}>
                      <label className="field-block">
                        <span>Usuário</span>
                        <select
                          className="toolbar-select"
                          value={adminSelectedEmail}
                          onChange={(event) => handleAdminUserChange(event.target.value)}
                        >
                          <option value="">Selecione um usuário</option>
                          {adminUsers.map((user) => (
                            <option key={user.email} value={user.email}>{user.email}</option>
                          ))}
                        </select>
                      </label>

                      <label className="field-block">
                        <span>Perfil</span>
                        <select
                          className="toolbar-select"
                          value={adminSelectedRole}
                          disabled={adminSelectedEmail === 'admin@admin'}
                          onChange={(event) => setAdminSelectedRole(event.target.value as UserRole)}
                        >
                          <option value="admin">Administrador</option>
                          <option value="gerente">Gerente</option>
                          <option value="cliente">Cliente</option>
                        </select>
                      </label>

                      <div className="field-block">
                        <span>Evento</span>
                        <button
                          type="button"
                          className="toolbar-select"
                          disabled={adminSelectedEmail === 'admin@admin'}
                          onClick={() => setShowEventChecklist((current) => !current)}
                        >
                          {adminSelectedProjects.length > 0 ? adminSelectedProjects.join(', ') : 'Selecionar eventos'}
                        </button>

                        {showEventChecklist && (
                          <div className="project-checkbox-grid">
                            {events.map((event) => (
                              <label key={event.id} className="project-checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={adminSelectedProjects.includes(event.name)}
                                  disabled={adminSelectedEmail === 'admin@admin'}
                                  onChange={() => {
                                    setAdminSelectedProjects((current) =>
                                      current.includes(event.name)
                                        ? current.filter((item) => item !== event.name)
                                        : [...current, event.name]
                                    )
                                  }}
                                />
                                <span>{event.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn-primary" disabled={adminSelectedEmail === 'admin@admin'}>Salvar permissões</button>
                    </form>
                  </article>
                )}

                <article className="settings-card">
                  <h4>Logout</h4>
                  <p>Encerre sua sessão e volte para a tela de login.</p>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      localStorage.removeItem('loggedUser')
                      localStorage.removeItem('userEmail')
                      setScreen('login')
                    }}
                  >
                    Sair da conta
                  </button>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>

      <MusicModal
        open={showMusicModal}
        onClose={() => {
          setShowMusicModal(false)
          setEditingMusic(null)
        }}
        events={events}
        editingMusic={editingMusic}
        onSave={handleMusicSave}
      />

      <PlayerModal
        open={!!playerMusic}
        onClose={() => setPlayerMusic(null)}
        youtubeLink={playerMusic ? buildEmbedUrl(playerMusic.youtubeLink) : ''}
        title={playerMusic ? `${playerMusic.title} — ${playerMusic.artist}` : ''}
      />

      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-kicker">Eventos</p>
                <h2>{editingEventId ? 'Editar evento' : 'Novo evento'}</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowEventModal(false)}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleSaveEvent}>
              <label className="field-block">
                <span>Nome do evento</span>
                <input
                  type="text"
                  required
                  value={eventForm.name}
                  onChange={(event) => setEventForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label className="field-block">
                <span>Organizador</span>
                <input
                  type="text"
                  required
                  value={eventForm.organizer}
                  onChange={(event) => setEventForm((current) => ({ ...current, organizer: event.target.value }))}
                />
              </label>

              <label className="field-block">
                <span>Data</span>
                <input
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={(event) => setEventForm((current) => ({ ...current, date: event.target.value }))}
                />
              </label>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setShowEventModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
