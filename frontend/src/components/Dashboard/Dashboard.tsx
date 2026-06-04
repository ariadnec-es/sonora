import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import EventCard from '../EventCard/EventCard'
import FolderTree, { type FolderNode } from '../FolderTree/FolderTree'
import MusicCard from '../MusicCard/MusicCard'
import MusicModal from '../MusicModal/MusicModal'
import PlayerModal from '../PlayerModal/PlayerModal'
import Sidebar, { type DashboardTab } from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import { type UserRole } from '../../services/auth'
import { loadFromStorage, saveToStorage } from '../../services/localStorage'
import type { EventItem } from '../../types/event'
import type { MusicItem } from '../../types/music'
import { buildEmbedUrl, buildThumbnail } from '../../utils/youtube'
import { fetchMe, logout as apiLogout } from '../../services/authApi'
import { fetchEvents, createEvent, updateEvent, deleteEvent as apiDeleteEvent } from '../../services/eventsApi'
import { fetchMusics, createMusic, updateMusic, deleteMusic as apiDeleteMusic } from '../../services/musicsApi'
import { fetchMusicOrders, createMusicOrder, updateMusicOrder, deleteMusicOrder, acceptMusicOrder, rejectMusicOrder } from '../../services/musicOrdersApi'
import { fetchFolders, createFolder, updateFolder, deleteFolder as apiDeleteFolder } from '../../services/foldersApi'
import { fetchUsers, updateUser } from '../../services/usersApi'
import type { ApiUser, ApiMusicOrder } from '../../types/api'
import { getAccessToken } from '../../services/api'

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 1,
    name: 'Cerimônia de Abertura',
    organizer: 'Ana Santos',
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    status: 'ativo',
    musicCount: 3,
    project: 'Cerimônia de Abertura',
  },
  {
    id: 2,
    name: 'Recepção dos convidados',
    organizer: 'Lucas Mendes',
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    status: 'ativo',
    musicCount: 1,
    project: 'Recepção dos convidados',
  },
  {
    id: 3,
    name: 'Espaço de dança',
    organizer: 'Marina Costa',
    startDate: '2026-06-11',
    endDate: '2026-06-11',
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
    status: 'accepted',
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
    status: 'accepted',
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
  console.log('DASHBOARD RENDER')

  useEffect(() => {
    console.log('DASHBOARD MOUNT')

    return () => {
      console.log('DASHBOARD UNMOUNT')
    }
  }, [])
  const [activeTab, setActiveTab] = useState<DashboardTab>('eventos')
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS)
  const [musics, setMusics] = useState<MusicItem[]>(DEFAULT_MUSICS)
  const [folders, setFolders] = useState<FolderNode[]>(DEFAULT_FOLDERS)
  const [showMusicModal, setShowMusicModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [playerMusic, setPlayerMusic] = useState<MusicItem | null>(null)
  const [editingMusic, setEditingMusic] = useState<MusicItem | null>(null)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'artist'>('order')
  const [filterType, setFilterType] = useState<'all' | 'fundo' | 'reacao'>('all')
  const [draggedMusicId, setDraggedMusicId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState('user@sonora.com')
  const [displayName, setDisplayName] = useState('Usuário')
  const [userRole, setUserRole] = useState<UserRole>('cliente')
  const [accessibleEvents, setAccessibleEvents] = useState<string[]>([])
  const [adminUsers, setAdminUsers] = useState<ApiUser[]>([])
  const [adminSelectedEmail, setAdminSelectedEmail] = useState('')
  const [adminSelectedRole, setAdminSelectedRole] = useState<UserRole>('cliente')
  const [adminSelectedProjects, setAdminSelectedProjects] = useState<string[]>([])
  const [showEventChecklist, setShowEventChecklist] = useState(false)
  const [managers, setManagers] = useState<ApiUser[]>([])
  const [eventForm, setEventForm] = useState({ name: '', organizer: '', startDate: '', endDate: '', managerId: '' })

  const refreshAdminUsers = useCallback(async () => {
    if (getAccessToken() && userRole === 'admin') {
      try {
        const users = await fetchUsers()
        setAdminUsers(users)
      } catch (err) {
        console.error('Falha ao buscar usuários:', err)
      }
    }
  }, [userRole])

  useEffect(() => {
    // Carrega dados do cache local imediatamente
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

    // Se houver token JWT, sincroniza com a API
    if (!getAccessToken()) return

    async function syncFromApi() {
      try {
        // 1. Dados do usuário autenticado
        const me = await fetchMe()
        const role: UserRole = me.is_admin ? 'admin' : me.is_manager ? 'gerente' : 'cliente'
        setUserRole(role)
        setUserEmail(me.email)
        setDisplayName(me.username)
        localStorage.setItem('loggedUser', JSON.stringify({
          id: me.id, email: me.email, username: me.username,
          is_admin: me.is_admin, is_manager: me.is_manager, role, projects: [],
        }))

        // 2. Eventos visíveis para este usuário
        // Admins vêem tudo, Gerentes vêem os deles, Clientes vêem eventos ativos públicos
        const apiEvents = await fetchEvents()
        const mappedEvents: EventItem[] = apiEvents.map((e, i) => ({
          id: i + 1,
          apiId: e.id,
          name: e.event_name,
          organizer: e.manager_username ?? e.manager ?? '',
          managerId: e.manager ?? '',
          startDate: e.start_date,
          endDate: e.end_date,
          status: e.is_active ? 'ativo' : 'inativo',
          musicCount: 0,
        }))
        setEvents(mappedEvents)
        saveToStorage('sonora_events', mappedEvents)
        // Para clientes, todos os eventos retornados pela API são "acessíveis" para envio de música
        setAccessibleEvents(mappedEvents.map(e => e.name))

        // 3. Músicas e Pedidos (MusicOrders)
        // Todos os usuários autenticados podem ver seus próprios MusicOrders
        const orders = await fetchMusicOrders()
        const mappedMusics: MusicItem[] = orders.map((order, i) => {
          const m = order.music_details
          const apiEvent = order.event_details
          const localEvent = mappedEvents.find(e => e.apiId === apiEvent?.id)
          return {
            id: i + 1,
            apiId: m?.id,
            orderApiId: order.id,
            order: order.order,
            artist: m?.singer ?? '',
            title: m?.name ?? '',
            youtubeLink: m?.url ?? '',
            notes: m?.observation ?? '',
            type: order.category === 'background' ? 'fundo' : 'reacao',
            status: order.status || 'pending',
            thumbnail: buildThumbnail(m?.url ?? ''),
            favorite: false,
            folderId: null,
            eventId: localEvent?.id ?? null,
            createdAt: order.created_at,
          }
        })

        // Adiciona músicas que não estão em ordens (músicas "soltas" do usuário)
        const ownMusics = await fetchMusics()
        const existingMusicApiIds = new Set(mappedMusics.map(m => m.apiId))
        const mappedOwn: MusicItem[] = ownMusics
          .filter(m => !existingMusicApiIds.has(m.id))
          .map((m, i) => ({
            id: mappedMusics.length + i + 1,
            apiId: m.id,
            order: mappedMusics.length + i + 1,
            artist: m.singer ?? '',
            title: m.name,
            youtubeLink: m.url ?? '',
            notes: m.observation ?? '',
            type: 'geral' as const,
            status: 'pending' as const,
            thumbnail: buildThumbnail(m.url ?? ''),
            favorite: false,
            folderId: null,
            eventId: null,
            createdAt: m.created_at,
          }))

        const allMusics = [...mappedMusics, ...mappedOwn]
        setMusics(allMusics)
        saveToStorage('sonora_music', allMusics)

        // 4. Pastas (Apenas para gerentes e admins, pois dependem de eventos que gerenciam)
        if (me.is_admin || me.is_manager) {
          const apiFolders = await fetchFolders()
          const flatFolders = apiFolders.map((f, i) => ({
            id: i + 1,
            apiId: f.id,
            name: f.name,
            parentId: null as number | null,
            children: [] as FolderNode[],
          }))
          const folderMap = new Map(flatFolders.map(f => [f.apiId, f]))
          const roots: FolderNode[] = []
          apiFolders.forEach((apif, i) => {
            const node = flatFolders[i]
            if (apif.parent) {
              const parentNode = folderMap.get(apif.parent)
              if (parentNode) {
                node.parentId = parentNode.id
                parentNode.children.push(node)
              } else roots.push(node)
            } else roots.push(node)
          })
          setFolders(roots)
          saveToStorage('sonora_folders', roots)
        }
      } catch (err) {
        console.warn('Falha ao sincronizar com a API, usando cache local.', err)
      }
    }

    syncFromApi()
  }, [refreshAdminUsers])

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
    if (userRole === 'admin' || userRole === 'cliente') {
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

      const matchesEvent = userRole === 'admin' || userRole === 'cliente' || !musicEventName || visibleEventNames.includes(musicEventName)
      const matchesSelectedEvent = selectedEventId === null || music.eventId === selectedEventId

      return matchesSearch && matchesFilter && matchesTab && matchesEvent && matchesSelectedEvent
    })

    filtered = [...filtered].sort((left, right) => {
      if (userRole === 'admin' || userRole === 'gerente') {
        const eventL = events.find(e => e.id === left.eventId)?.name || ''
        const eventR = events.find(e => e.id === right.eventId)?.name || ''
        if (eventL !== eventR) return eventL.localeCompare(eventR)
      }

      if (sortBy === 'title') return left.title.localeCompare(right.title)
      if (sortBy === 'artist') return left.artist.localeCompare(right.artist)
      return left.order - right.order
    })

    return filtered
    }, [activeTab, events, filterType, musics, search, sortBy, userRole, visibleEventNames, selectedEventId])

    async function handleStatusChange(id: number, status: 'pending' | 'accepted' | 'rejected') {
      if (!canManageMusic) return
      const music = musics.find(m => m.id === id)
      if (!music) return

      if (!music.orderApiId) {
        toast.error('Esta música não está vinculada a um pedido oficial e não pode ter o status alterado.')
        return
      }

      // Atualiza estado local primeiro para feedback instantâneo
      setMusics(current => current.map(m => m.id === id ? { ...m, status } : m))

      try {
        let updatedOrder: ApiMusicOrder | undefined
        if (status === 'accepted') {
          updatedOrder = await acceptMusicOrder(music.orderApiId)
          toast.success('Música aceita com sucesso.')
        } else if (status === 'rejected') {
          updatedOrder = await rejectMusicOrder(music.orderApiId)
          toast.success('Música recusada com sucesso.')
        }

        // Sincroniza com o dado real vindo do servidor
        if (updatedOrder) {
          setMusics(current => current.map(m => 
            m.id === id ? { ...m, status: updatedOrder.status || status } : m
          ))
        }
      } catch (err) {
        console.error('Erro ao atualizar status:', err)
        toast.error('Falha ao sincronizar status no servidor. Revertendo alteração local.')
        // Reverte o status local em caso de erro (busca o original)
        const original = musics.find(m => m.id === id)
        if (original) {
          setMusics(current => current.map(m => m.id === id ? { ...m, status: original.status } : m))
        }
      }
    }


  async function openNewEvent() {
    setEditingEventId(null)
    setEventForm({ name: '', organizer: '', startDate: '', endDate: '', managerId: '' })
    if (userRole === 'admin') {
      try {
        const managersList = await fetchUsers(true)
        setManagers(managersList)
      } catch {
        toast.error('Falha ao carregar gerentes.')
      }
    }
    setShowEventModal(true)
  }

  async function handleSaveEvent(event: React.FormEvent) {
    event.preventDefault()

    const duplicateEvent = events.some((item) =>
      item.id !== editingEventId &&
      normalizeText(item.name) === normalizeText(eventForm.name) &&
      item.endDate === eventForm.endDate
    )
    if (duplicateEvent) {
      toast.error('Já existe um evento igual cadastrado.')
      return
    }

    const selectedManager = managers.find(m => m.id === eventForm.managerId)

    if (editingEventId) {
      const existing = events.find(e => e.id === editingEventId)
      // Persiste localmente
      setEvents((current) =>
        current.map((item) =>
          item.id === editingEventId
            ? { ...item, name: eventForm.name, organizer: selectedManager?.username || eventForm.organizer, managerId: eventForm.managerId, startDate: eventForm.startDate, endDate: eventForm.endDate,
                musicCount: musics.filter((m) => m.eventId === item.id).length }
            : item
        )
      )
      toast.success('Evento atualizado.')
      // Sincroniza com API
      if (existing?.apiId) {
        updateEvent(existing.apiId, {
          event_name: eventForm.name,
          start_date: eventForm.startDate,
          end_date: eventForm.endDate,
          manager: eventForm.managerId || null
        }).catch(() => toast.error('Falha ao sincronizar evento com o servidor.'))
      }
    } else {
      const localId = Date.now()
      const newEvent: EventItem = {
        id: localId,
        name: eventForm.name,
        organizer: selectedManager?.username || eventForm.organizer,
        managerId: eventForm.managerId,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        status: 'ativo',
        musicCount: 0,
      }
      setEvents((current) => [...current, newEvent])
      toast.success('Evento salvo com sucesso.')
      // Sincroniza com API
      if (getAccessToken()) {
        createEvent({
          event_name: eventForm.name,
          start_date: eventForm.startDate,
          end_date: eventForm.endDate,
          manager: eventForm.managerId || null
        }).then((apiEvent) => {
          setEvents((current) =>
            current.map((e) => e.id === localId ? { ...e, apiId: apiEvent.id } : e)
          )
        }).catch(() => toast.error('Falha ao criar evento no servidor.'))
      }
    }

    setShowEventModal(false)
    setEventForm({ name: '', organizer: '', startDate: '', endDate: '', managerId: '' })
    setEditingEventId(null)
  }

  async function handleEditEvent(event: EventItem) {
    setEditingEventId(event.id)
    setEventForm({
      name: event.name,
      organizer: event.organizer,
      startDate: event.startDate,
      endDate: event.endDate,
      managerId: event.managerId || '',
    })
    if (userRole === 'admin') {
      try {
        const managersList = await fetchUsers(true)
        setManagers(managersList)
      } catch {
        toast.error('Falha ao carregar gerentes.')
      }
    }
    setShowEventModal(true)
  }

  function deleteEvent(id: number) {
    const existing = events.find((e) => e.id === id)
    setEvents((current) => current.filter((event) => event.id !== id))
    setMusics((current) => current.map((music) => (music.eventId === id ? { ...music, eventId: null } : music)))
    toast.success('Evento removido.')
    if (existing?.apiId) {
      apiDeleteEvent(existing.apiId).catch(() =>
        toast.error('Falha ao remover evento no servidor.')
      )
    }
  }

  function openEvent(event: EventItem) {
    setActiveTab('musicas')
    setSearch('')
    setFilterType('all')
    setSelectedEventId(event.id)
    toast.success(`Abrindo músicas de ${event.name}`)
  }

  function handleOpenMusicModal() {
    setEditingMusic(null)
    setShowMusicModal(true)
  }

  async function handleMusicSave(payload: Omit<MusicItem, 'thumbnail' | 'createdAt'> & { id?: number }) {
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
      // Edição de música existente
      const existing = musics.find((m) => m.id === payload.id)
      if (!existing) return

      // 1. Atualiza estado local para feedback visual imediato
      setMusics((current) =>
        current.map((music) =>
          music.id === payload.id
            ? { ...music, ...payload, thumbnail: buildThumbnail(payload.youtubeLink) }
            : music
        )
      )
      toast.success('Música atualizada localmente.')

      try {
        // 2. Sincroniza YoutubeMusic na API
        let musicApiId = existing.apiId
        if (!musicApiId && getAccessToken()) {
          const apiMusic = await createMusic({
            name: payload.title,
            url: payload.youtubeLink,
            singer: payload.artist,
            observation: payload.notes,
          })
          musicApiId = apiMusic.id
          // Atualiza apiId no estado local
          setMusics(current => current.map(m => m.id === payload.id ? { ...m, apiId: musicApiId } : m))
        } else if (musicApiId) {
          await updateMusic(musicApiId, {
            name: payload.title,
            url: payload.youtubeLink,
            singer: payload.artist,
            observation: payload.notes,
          })
        }

        // 3. Sincroniza ou Cria o vínculo (MusicOrder)
        const localEvent = events.find((e) => e.id === payload.eventId)
        if (localEvent?.apiId && musicApiId) {
          if (existing.orderApiId) {
            // Se já tinha vínculo, atualiza
            await updateMusicOrder(existing.orderApiId, {
              event: localEvent.apiId,
              order: payload.order,
              category: payload.type === 'fundo' ? 'background' : 'interactive',
            })
          } else {
            // Se NÃO tinha vínculo, cria um agora
            const apiOrder = await createMusicOrder({
              music: musicApiId,
              event: localEvent.apiId,
              order: payload.order,
              category: payload.type === 'fundo' ? 'background' : 'interactive',
            })
            // Salva o novo ID do vínculo no estado local
            setMusics(current => current.map(m => m.id === payload.id ? { ...m, orderApiId: apiOrder.id } : m))
          }
        }
        toast.success('Alterações sincronizadas com o servidor.')
      } catch (err) {
        console.error('Erro ao salvar música:', err)
        toast.error('Falha ao sincronizar totalmente com o servidor.')
      }
    } else {
      // Criação de nova música
      const localId = Date.now()
      const newMusic: MusicItem = {
        ...payload,
        id: localId,
        thumbnail: buildThumbnail(payload.youtubeLink),
        createdAt: new Date().toISOString(),
      }
      setMusics((current) => [...current, newMusic])
      toast.success('Música adicionada ao painel.')

      if (getAccessToken()) {
        try {
          // 1. Cria YoutubeMusic
          const apiMusic = await createMusic({
            name: payload.title,
            url: payload.youtubeLink,
            singer: payload.artist,
            observation: payload.notes,
          })

          // 2. Cria MusicOrder se houver evento
          const localEvent = events.find((e) => e.id === payload.eventId)
          if (localEvent?.apiId) {
            const apiOrder = await createMusicOrder({
              music: apiMusic.id,
              event: localEvent.apiId,
              order: payload.order,
              category: payload.type === 'fundo' ? 'background' : 'interactive',
            })
            setMusics((current) =>
              current.map((m) =>
                m.id === localId ? { ...m, apiId: apiMusic.id, orderApiId: apiOrder.id } : m
              )
            )
          } else {
            setMusics((current) =>
              current.map((m) => m.id === localId ? { ...m, apiId: apiMusic.id } : m)
            )
          }
          toast.success('Música e vínculo salvos no servidor.')
        } catch (err) {
          console.error('Erro ao criar música:', err)
          toast.error('Música salva localmente, mas falhou no servidor.')
        }
      }
    }

    setShowMusicModal(false)
    setEditingMusic(null)
  }

  function handleEditMusic(music: MusicItem) {
    setEditingMusic(music)
    setShowMusicModal(true)
  }

  function handleDeleteMusic(id: number) {
    const existing = musics.find((m) => m.id === id)
    setMusics((current) => current.filter((music) => music.id !== id))
    toast.success('Música removida.')
    if (existing?.orderApiId) {
      deleteMusicOrder(existing.orderApiId).catch(() => {})
    } else if (existing?.apiId) {
      apiDeleteMusic(existing.apiId).catch(() => {})
    }
  }

  function handleToggleFavorite(id: number) {
    setMusics((current) =>
      current.map((music) =>
        music.id === id ? { ...music, favorite: !music.favorite } : music
      )
    )
  }

  function handleMoveType(id: number, type: 'fundo' | 'reacao' | 'geral') {
    if (!canManageMusic) return
    setMusics((current) =>
      current.map((music) =>
        music.id === id ? { ...music, type } : music
      )
    )
  }

  async function reorderMusics(targetId: number) {
    if (!canManageMusic) return
    if (draggedMusicId === null || targetId === draggedMusicId) return

    const draggedMusic = musics.find((m) => m.id === draggedMusicId)
    if (!draggedMusic) return

    let resolvedOrder = -1

    setMusics((current) => {
      const updated = [...current]
      const fromIndex = updated.findIndex((music) => music.id === draggedMusicId)
      const toIndex = updated.findIndex((music) => music.id === targetId)

      if (fromIndex < 0 || toIndex < 0) return current

      const [item] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, item)

      resolvedOrder = toIndex + 1

      return updated.map((music, index) => ({ ...music, order: index + 1 }))
    })

    if (resolvedOrder > 0 && draggedMusic.orderApiId && getAccessToken()) {
      try {
        // O backend agora re-sequencia tudo baseado nesta nova posição
        await updateMusicOrder(draggedMusic.orderApiId, { order: resolvedOrder })
        toast.success('Ordem sincronizada.')
      } catch {
        toast.error('Falha ao sincronizar ordem no servidor.')
      }
    }

    setDraggedMusicId(null)
  }

  async function handleMoveMusic(musicId: number, folderId: number | null) {
    if (!canManageMusic) return
    if (musicId <= 0) return

    const music = musics.find((m) => m.id === musicId)
    if (!music) return

    setMusics((current) =>
      current.map((m) => (m.id === musicId ? { ...m, folderId } : m))
    )

    if (getAccessToken() && music.orderApiId) {
      let folderApiId: string | null = null
      if (folderId !== null) {
        const findFolderApiId = (nodes: FolderNode[]): string | null => {
          for (const node of nodes) {
            if (node.id === folderId) return node.apiId || null
            const found = findFolderApiId(node.children)
            if (found) return found
          }
          return null
        }
        folderApiId = findFolderApiId(folders)
      }

      try {
        await updateMusicOrder(music.orderApiId, { folder: folderApiId })
        toast.success('Música movida com sucesso.')
      } catch {
        toast.error('Falha ao sincronizar movimento no servidor.')
      }
    }
  }

  function handleCreateFolder(parentId: number | null) {
    const name = window.prompt('Nome da pasta')
    if (!name?.trim()) return

    const localId = Date.now()
    const newFolder: FolderNode = {
      id: localId,
      name: name.trim(),
      parentId,
      children: [],
    }
    setFolders((current) => applyFolderTree(current, parentId, newFolder))
    toast.success('Pasta criada.')

    // Sincroniza com API — precisa de um evento associado
    if (getAccessToken()) {
      // Tenta encontrar o evento via pasta pai
      const parentFolder = parentId
        ? (function findFolder(nodes: FolderNode[]): FolderNode | undefined {
            for (const n of nodes) {
              if (n.id === parentId) return n
              const found = findFolder(n.children)
              if (found) return found
            }
          })(folders)
        : undefined

      // Usa o primeiro evento disponível se não houver contexto
      const eventApiId = events.find(e => e.apiId)?.apiId
      const parentApiId = parentFolder?.apiId
      if (eventApiId) {
        createFolder({
          name: name.trim(),
          event: eventApiId,
          parent: parentApiId ?? null,
        }).then((apif) => {
          setFolders((current) =>
            updateFolderTree(current, localId, (node) => ({ ...node, apiId: apif.id }))
          )
        }).catch(() => {})
      }
    }
  }

  function handleEditFolder(folder: FolderNode) {
    const name = window.prompt('Editar nome da pasta', folder.name)
    if (!name?.trim()) return

    setFolders((current) =>
      updateFolderTree(current, folder.id, (node) => ({ ...node, name: name.trim() }))
    )
    if (folder.apiId) {
      updateFolder(folder.apiId, { name: name.trim() }).catch(() => {})
    }
  }

  function handleDeleteFolder(folderId: number) {
    const node = (function find(nodes: FolderNode[]): FolderNode | undefined {
      for (const n of nodes) {
        if (n.id === folderId) return n
        const found = find(n.children)
        if (found) return found
      }
    })(folders)
    setFolders((current) => removeFolderTree(current, folderId))
    setMusics((current) => current.map((music) => (music.folderId === folderId ? { ...music, folderId: null } : music)))
    toast.success('Pasta removida.')
    if (node?.apiId) {
      apiDeleteFolder(node.apiId).catch(() => {})
    }
  }

  async function handleAdminAccessSave(event: React.FormEvent) {
    event.preventDefault()

    if (!adminSelectedEmail) {
      toast.error('Selecione um usuário para gerenciar.')
      return
    }

    const selectedUser = adminUsers.find((u) => u.email === adminSelectedEmail)
    if (!selectedUser) return

    const lockedAdminUser = adminSelectedEmail === 'admin@admin'
    // Sincroniza com o backend
    if (getAccessToken()) {
      const eventIds = events
        .filter((e) => adminSelectedProjects.includes(e.name))
        .map((e) => e.apiId)
        .filter((id): id is string => !!id)

      try {
        await updateUser(selectedUser.id, {
          is_manager: lockedAdminUser ? false : adminSelectedRole === 'gerente',
          is_admin: lockedAdminUser ? true : adminSelectedRole === 'admin',
          event_ids: eventIds,
        })
        toast.success('Permissões atualizadas no servidor.')
        refreshAdminUsers()
      } catch {
        toast.error('Falha ao sincronizar permissões com o servidor.')
      }
    }

    // Fallback/Legacy para compatibilidade local
    const updatedUsers = adminUsers.map((user) =>
      user.email === adminSelectedEmail
        ? {
            ...user,
            is_manager: lockedAdminUser ? false : adminSelectedRole === 'gerente',
            is_admin: lockedAdminUser ? true : adminSelectedRole === 'admin',
          }
        : user
    )

    const updatedUser = updatedUsers.find((user) => user.email === adminSelectedEmail)

    if (updatedUser && updatedUser.email === userEmail) {
      const role: UserRole = updatedUser.is_admin ? 'admin' : updatedUser.is_manager ? 'gerente' : 'cliente'
      setUserRole(role)
      setAccessibleEvents(adminSelectedProjects)

      const updatedLoggedUser = {
        email: updatedUser.email,
        displayName: updatedUser.username,
        role: role,
        projects: adminSelectedProjects,
      }

      localStorage.setItem('loggedUser', JSON.stringify(updatedLoggedUser))
    }
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

    const role: UserRole = user?.is_admin ? 'admin' : user?.is_manager ? 'gerente' : 'cliente'
    setAdminSelectedRole(role)
    const projects = user?.my_events?.map(e => e.event_name) || []
    setAdminSelectedProjects(normalizeEventAccess(projects, events.map((event) => event.name)))
  }

  useEffect(() => {
    if (activeTab === 'configuracoes' && userRole === 'admin') {
      refreshAdminUsers()
    }
  }, [activeTab, userRole, refreshAdminUsers])

  const musicSummary = {
    total: visibleMusics.length,
    favorites: visibleMusics.filter((music) => music.favorite).length,
    fundo: visibleMusics.filter((music) => music.type === 'fundo').length,
    reacoes: visibleMusics.filter((music) => music.type === 'reacao').length,
  }

  const canManageMusic = userRole === 'admin' || userRole === 'gerente'

  return (
    <div className="dashboard-shell">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} userEmail={userEmail} userRole={userRole} />

      <div className="dashboard-main">
        <Topbar
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          email={userEmail}
          onLogout={() => {
            apiLogout()
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
                  <select
                    className="toolbar-select"
                    value={selectedEventId ?? ''}
                    onChange={(event) => setSelectedEventId(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Todos os eventos</option>
                    {visibleEvents.map((event) => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>

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

                  {getAccessToken() && (
                    <button type="button" className="btn-primary" onClick={handleOpenMusicModal}>Adicionar Música</button>
                  )}
                </div>
              </div>

              <div className="music-list-stack">
                {visibleEvents.map(event => {
                  const eventMusics = visibleMusics.filter(m => m.eventId === event.id)
                  if (eventMusics.length === 0) return null
                  
                  return (
                    <div key={event.id} className="event-music-group" style={{ marginBottom: '24px' }}>
                      <h4 style={{ 
                        padding: '8px 16px', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: '8px',
                        marginBottom: '12px',
                        color: 'var(--accent)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        Evento: {event.name}
                        <span style={{ fontSize: '0.7rem', color: '#8fa0bc' }}>{eventMusics.length} músicas</span>
                      </h4>
                      <div className="music-list-stack">
                        {eventMusics.map((music) => (
                          <MusicCard
                            key={music.id}
                            music={music}
                            eventName={event.name}
                            canManage={canManageMusic}
                            onEdit={handleEditMusic}
                            onDelete={handleDeleteMusic}
                            onToggleFavorite={handleToggleFavorite}
                            onPlay={(item) => setPlayerMusic(item)}
                            onMoveType={handleMoveType}
                            onStatusChange={handleStatusChange}
                            onDragStart={setDraggedMusicId}
                            onDrop={reorderMusics}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Loose musics (though now mandatory, legacy or unlinked items) */}
                {visibleMusics.filter(m => !m.eventId).length > 0 && (
                  <div className="event-music-group">
                    <h4 style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '12px' }}>Sem Evento</h4>
                    <div className="music-list-stack">
                      {visibleMusics.filter(m => !m.eventId).map((music) => (
                        <MusicCard
                          key={music.id}
                          music={music}
                          canManage={canManageMusic}
                          onEdit={handleEditMusic}
                          onDelete={handleDeleteMusic}
                          onToggleFavorite={handleToggleFavorite}
                          onPlay={(item) => setPlayerMusic(item)}
                          onMoveType={handleMoveType}
                          onStatusChange={handleStatusChange}
                          onDragStart={setDraggedMusicId}
                          onDrop={reorderMusics}
                        />
                      ))}
                    </div>
                  </div>
                )}

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
                {visibleEvents.map(event => {
                  const eventMusics = visibleMusics.filter(m => m.eventId === event.id)
                  if (eventMusics.length === 0) return null
                  
                  return (
                    <div key={event.id} className="event-music-group" style={{ marginBottom: '24px' }}>
                      <h4 style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
                        Evento: {event.name}
                      </h4>
                      <div className="music-list-stack">
                        {eventMusics.map((music) => (
                          <MusicCard
                            key={music.id}
                            music={music}
                            eventName={event.name}
                            canManage={canManageMusic}
                            onEdit={handleEditMusic}
                            onDelete={handleDeleteMusic}
                            onToggleFavorite={handleToggleFavorite}
                            onPlay={(item) => setPlayerMusic(item)}
                            onMoveType={handleMoveType}
                            onStatusChange={handleStatusChange}
                            onDragStart={setDraggedMusicId}
                            onDrop={reorderMusics}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
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
                {visibleEvents.map(event => {
                  const eventMusics = visibleMusics.filter(m => m.eventId === event.id)
                  if (eventMusics.length === 0) return null
                  
                  return (
                    <div key={event.id} className="event-music-group" style={{ marginBottom: '24px' }}>
                      <h4 style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
                        Evento: {event.name}
                      </h4>
                      <div className="music-list-stack">
                        {eventMusics.map((music) => (
                          <MusicCard
                            key={music.id}
                            music={music}
                            eventName={event.name}
                            canManage={canManageMusic}
                            onEdit={handleEditMusic}
                            onDelete={handleDeleteMusic}
                            onToggleFavorite={handleToggleFavorite}
                            onPlay={(item) => setPlayerMusic(item)}
                            onMoveType={handleMoveType}
                            onStatusChange={handleStatusChange}
                            onDragStart={setDraggedMusicId}
                            onDrop={reorderMusics}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
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
                {visibleEvents.map(event => {
                  const eventMusics = visibleMusics.filter(m => m.eventId === event.id)
                  if (eventMusics.length === 0) return null
                  
                  return (
                    <div key={event.id} className="event-music-group" style={{ marginBottom: '24px' }}>
                      <h4 style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
                        Evento: {event.name}
                      </h4>
                      <div className="music-list-stack">
                        {eventMusics.map((music) => (
                          <MusicCard
                            key={music.id}
                            music={music}
                            eventName={event.name}
                            canManage={canManageMusic}
                            onEdit={handleEditMusic}
                            onDelete={handleDeleteMusic}
                            onToggleFavorite={handleToggleFavorite}
                            onPlay={(item) => setPlayerMusic(item)}
                            onMoveType={handleMoveType}
                            onStatusChange={handleStatusChange}
                            onDragStart={setDraggedMusicId}
                            onDrop={reorderMusics}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
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
                      apiLogout()
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
        defaultEventId={selectedEventId}
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

              {userRole === 'admin' && (
                <label className="field-block">
                  <span>Gerente</span>
                  <select
                    value={eventForm.managerId}
                    onChange={(event) => setEventForm((current) => ({ ...current, managerId: event.target.value }))}
                  >
                    <option value="">Selecione um gerente</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>{manager.username} ({manager.email})</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field-block">
                <span>Data de Início</span>
                <input
                  type="date"
                  required
                  value={eventForm.startDate}
                  onChange={(event) => setEventForm((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>

              <label className="field-block">
                <span>Data de Fim</span>
                <input
                  type="date"
                  required
                  value={eventForm.endDate}
                  onChange={(event) => setEventForm((current) => ({ ...current, endDate: event.target.value }))}
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
