
import { apiFetch, getAccessToken } from "../../services/api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import EventCard from "../EventCard/EventCard";
import FolderTree, { type FolderNode } from "../FolderTree/FolderTree";
import MusicCard from "../MusicCard/MusicCard";
import MusicModal from "../MusicModal/MusicModal";
import PlayerModal from "../PlayerModal/PlayerModal";
import Sidebar, { type DashboardTab } from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import { type UserRole, loadUsers, saveUsers } from "../../services/auth";
import { loadFromStorage, saveToStorage } from "../../services/localStorage";
import type { EventItem } from "../../types/event";
import type { MusicItem } from "../../types/music";
import { buildEmbedUrl, buildThumbnail } from "../../utils/youtube";
import { fetchMe, logout as apiLogout } from "../../services/authApi";
import {
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent as apiDeleteEvent,
} from "../../services/eventsApi";
import {
    fetchMusics,
    createMusic,
    updateMusic,
    deleteMusic as apiDeleteMusic,
} from "../../services/musicsApi";
import {
    fetchMusicOrders,
    createMusicOrder,
    updateMusicOrder,
    deleteMusicOrder,
    acceptMusicOrder,
    rejectMusicOrder,
} from "../../services/musicOrdersApi";
import {
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder as apiDeleteFolder,
} from "../../services/foldersApi";
import { fetchUsers, updateUser } from "../../services/usersApi";
import type { ApiUser, ApiMusicOrder } from "../../types/api";


const DEFAULT_EVENTS: EventItem[] = [
    {
        id: 1,
        name: "Cerimônia de Abertura",
        organizer: "Ana Santos",
        startDate: "2026-06-10",
        endDate: "2026-06-10",
        status: "ativo",
        musicCount: 3,
        project: "Cerimônia de Abertura",
    },
    {
        id: 2,
        name: "Recepção dos convidados",
        organizer: "Lucas Mendes",
        startDate: "2026-06-10",
        endDate: "2026-06-10",
        status: "ativo",
        musicCount: 1,
        project: "Recepção dos convidados",
    },
    {
        id: 3,
        name: "Espaço de dança",
        organizer: "Marina Costa",
        startDate: "2026-06-11",
        endDate: "2026-06-11",
        status: "ativo",
        musicCount: 0,
        project: "Espaço de dança",
    },
];

const DEFAULT_MUSICS: MusicItem[] = [
    {
        id: 1,
        order: 1,
        artist: "Adele",
        title: "Hello",
        youtubeLink: "https://www.youtube.com/watch?v=YQHsXMglC9A",
        notes: "Entrada principal",
        type: "fundo",
        status: "accepted",
        thumbnail: buildThumbnail(
            "https://www.youtube.com/watch?v=YQHsXMglC9A",
        ),
        favorite: true,
        folderId: 1,
        eventId: 1,
        project: "Cerimônia de Abertura",
        createdAt: new Date().toISOString(),
    },
    {
        id: 2,
        order: 2,
        artist: "The Weeknd",
        title: "Blinding Lights",
        youtubeLink: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
        notes: "Reação do público",
        type: "reacao",
        status: "accepted",
        thumbnail: buildThumbnail(
            "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
        ),
        favorite: false,
        folderId: 2,
        eventId: 2,
        project: "Recepção dos convidados",
        createdAt: new Date().toISOString(),
    },
];

const DEFAULT_FOLDERS: FolderNode[] = [
    {
        id: 1,
        name: "Abertura",
        parentId: null,
        children: [],
    },
    {
        id: 2,
        name: "Intervalo",
        parentId: null,
        children: [],
    },
];

interface DashboardProps {
    setScreen: React.Dispatch<
        React.SetStateAction<"login" | "register" | "dashboard">
    >;
}

const TAB_LABELS: Record<DashboardTab, { title: string; subtitle: string }> = {
    eventos: {
        title: "Eventos",
        subtitle:
            "Gerencie todos os eventos da cerimônia e suas playlists associadas.",
    },
    musicas: {
        title: "Músicas",
        subtitle:
            "Cadastre, filtre e organize as músicas com busca, ordenação e player.",
    },
    fundo: {
        title: "Música de Fundo",
        subtitle:
            "Acompanhe o repertório de ambiente e suas movimentações entre categorias.",
    },
    reacoes: {
        title: "Reações",
        subtitle:
            "Visualize músicas de reação e ajuste rapidamente a categorização.",
    },
    pastas: {
        title: "Pastas",
        subtitle:
            "Organize repertórios em pastas e subpastas com drag and drop.",
    },
    favoritos: {
        title: "Favoritos",
        subtitle: "Acesse as músicas preferidas em um espaço dedicado.",
    },
    configuracoes: {
        title: "Configurações",
        subtitle: "Ajuste o visual, o nome e a sessão do usuário.",
    },
    dashboard: {
        title: "Dashboard",
        subtitle: "Estatísticas e informações consolidadas sobre a cerimônia.",
    },
};

const normalizeText = (value: string) => value.trim().toLowerCase();
const normalizeEventAccess = (values: string[], eventNames: string[]) => {
    return (values || []).filter((value) => (eventNames || []).includes(value));
};

const applyFolderTree = (
    tree: FolderNode[],
    parentId: number | null,
    folder: FolderNode,
): FolderNode[] => {
    if (parentId === null) {
        return [...(tree || []), folder];
    }

    return (tree || []).map((node) =>
        node.id === parentId
            ? {
                ...node,
                children: [...(node.children || []), folder],
            }
            : {
                ...node,
                children: applyFolderTree(node.children || [], parentId, folder),
            },
    );
};

const updateFolderTree = (
    tree: FolderNode[],
    folderId: number,
    updater: (folder: FolderNode) => FolderNode,
): FolderNode[] => {
    return (tree || []).map((node) => {
        if (node.id === folderId) {
            return updater(node);
        }

        return {
            ...node,
            children: updateFolderTree(node.children || [], folderId, updater),
        };
    });
};

const removeFolderTree = (
    tree: FolderNode[],
    folderId: number,
): FolderNode[] => {
    return (tree || [])
        .filter((node) => node.id !== folderId)
        .map((node) => ({
            ...node,
            children: removeFolderTree(node.children || [], folderId),
        }));
};

export default function Dashboard({ setScreen }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<DashboardTab>("eventos");
    const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
    const [musics, setMusics] = useState<MusicItem[]>(DEFAULT_MUSICS);
    const [folders, setFolders] = useState<FolderNode[]>(DEFAULT_FOLDERS);
    const [showMusicModal, setShowMusicModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [playerMusic, setPlayerMusic] = useState<MusicItem | null>(null);
    const [editingMusic, setEditingMusic] = useState<MusicItem | null>(null);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"order" | "title" | "artist">("order");
    const [filterType, setFilterType] = useState<"all" | "fundo" | "reacao">("all");
    const [draggedMusicId, setDraggedMusicId] = useState<number | null>(null);
    const [userEmail, setUserEmail] = useState("user@sonora.com");
    const [displayName, setDisplayName] = useState("Usuário");
    const [userRole, setUserRole] = useState<UserRole>("cliente");
    const [accessibleEvents, setAccessibleEvents] = useState<string[]>([]);
    const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
    const [adminSelectedEmail, setAdminSelectedEmail] = useState("");
    const [adminSelectedRole, setAdminSelectedRole] = useState<UserRole>("cliente");
    const [adminSelectedProjects, setAdminSelectedProjects] = useState<string[]>([]);
    const [showEventChecklist, setShowEventChecklist] = useState(false);
    const [managers, setManagers] = useState<ApiUser[]>([]);
    const [eventForm, setEventForm] = useState({
        name: "",
        organizer: "",
        startDate: "",
        endDate: "",
        managerId: "",
    });

    // Estados integrados para a API de Dashboard
    const [dashboardApiData, setDashboardApiData] = useState<any | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    // Ajustado para validar "manager" em vez de "gerente" - Declarado antes das funções para evitar ReferenceError
    const canManageMusic = userRole === "admin" || userRole === "manager";

    const refreshAdminUsers = async () => {
        if (getAccessToken() && userRole === "admin") {
            try {
                const users = await fetchUsers();
                setAdminUsers(users || []);
            } catch (err) {
                console.error("Falha ao buscar usuários:", err);
            }
        }
    };

    const fetchDashboardData = async () => {
        const token = getAccessToken();
        if (!token) return;

        setLoadingDashboard(true);
        setDashboardError(null);

        try {
            const data = await apiFetch<any>("/dashboard/");
            setDashboardApiData(data);
        } catch (err: any) {
            console.error("Erro ao buscar dados do dashboard:", err);
            setDashboardError("Não foi possível carregar os dados analíticos do servidor.");
        } finally {
            setLoadingDashboard(false);
        }
    };

    // Efeito para buscar os dados consolidados ao selecionar a aba Dashboard
    useEffect(() => {
        if (activeTab === "dashboard" && (userRole === "admin" || userRole === "manager")) {
            fetchDashboardData();
        }
    }, [activeTab, userRole]);

    useEffect(() => {
        const storedEvents = loadFromStorage<EventItem[]>("sonora_events", []);
        const storedMusics = loadFromStorage<MusicItem[]>("sonora_music", []);
        const storedFolders = loadFromStorage<FolderNode[]>(
            "sonora_folders",
            [],
        );
        const storedSettings = loadFromStorage<{ displayName: string }>(
            "sonora_settings",
            { displayName: "" },
        );
        const storedUser = loadFromStorage<{
            email: string;
            displayName?: string;
            role?: UserRole;
            projects?: string[];
        } | null>("loggedUser", null);
        const resolvedEmail =
            storedUser?.email ||
            localStorage.getItem("userEmail") ||
            "user@sonora.com";
        const initialEvents = storedEvents.length
            ? storedEvents
            : DEFAULT_EVENTS;
        setEvents(initialEvents);
        setMusics(storedMusics.length ? storedMusics : DEFAULT_MUSICS);
        setFolders(storedFolders.length ? storedFolders : DEFAULT_FOLDERS);
        setUserEmail(resolvedEmail);
        setDisplayName(
            storedSettings.displayName ||
            storedUser?.displayName ||
            resolvedEmail.split("@")[0],
        );
        setUserRole(storedUser?.role || "cliente");
        setAccessibleEvents(
            normalizeEventAccess(
                storedUser?.projects || [],
                initialEvents.map((event) => event.name),
            ),
        );
        refreshAdminUsers();

        if (!getAccessToken()) return;

        async function syncFromApi() {
            try {
                const me = await fetchMe();
                const role: UserRole = me.is_admin
                    ? "admin"
                    : me.is_manager
                        ? "manager"
                        : "cliente";
                setUserRole(role);
                setUserEmail(me.email);
                setDisplayName(me.username);
                localStorage.setItem(
                    "loggedUser",
                    JSON.stringify({
                        id: me.id,
                        email: me.email,
                        username: me.username,
                        is_admin: me.is_admin,
                        is_manager: me.is_manager,
                        role,
                        projects: [],
                    }),
                );

                const apiEventsList = me.my_events || [];
                const mappedEvents: EventItem[] = apiEventsList.map(
                    (e: any, i: number) => ({
                        id: i + 1,
                        apiId: e.event_id,
                        name: e.event_name,
                        organizer: me.username,
                        managerId: me.id,
                        startDate: e.event_start_date,
                        endDate: e.event_end_date,
                        status: "ativo",
                        musicCount: e.musics ? e.musics.length : 0,
                    }),
                );
                setEvents(mappedEvents);
                saveToStorage("sonora_events", mappedEvents);
                setAccessibleEvents(mappedEvents.map((e) => e.name));

                const tempMusics: MusicItem[] = [];
                let musicIndex = 1;

                apiEventsList.forEach((e: any) => {
                    const localEvent = mappedEvents.find(
                        (le) => le.apiId === e.event_id,
                    );
                    if (e.musics) {
                        e.musics.forEach((m: any) => {
                            tempMusics.push({
                                id: musicIndex++,
                                apiId: m.music_id,
                                orderApiId: m.id,
                                order: m.order,
                                artist: m.singer || "",
                                title: m.name || "",
                                youtubeLink: m.url || "",
                                notes: "",
                                type:
                                    m.category === "background"
                                        ? "fundo"
                                        : "reacao",
                                status: m.status || "pending",
                                thumbnail: buildThumbnail(m.url || ""),
                                favorite: false,
                                folderId: m.folder || null,
                                eventId: localEvent?.id ?? null,
                                createdAt: new Date().toISOString(),
                            });
                        });
                    }
                });

                if (me.my_sounds) {
                    me.my_sounds.forEach((sound: any) => {
                        const alreadyAdded = tempMusics.some(
                            (tm) => tm.apiId === sound.id,
                        );
                        if (!alreadyAdded) {
                            tempMusics.push({
                                id: musicIndex++,
                                apiId: sound.id,
                                order: musicIndex,
                                artist: sound.singer || "",
                                title: sound.name || "",
                                youtubeLink: sound.url || "",
                                notes: sound.observation || "",
                                type: "geral" as const,
                                status: "pending" as const,
                                thumbnail: buildThumbnail(sound.url || ""),
                                favorite: false,
                                folderId: null,
                                eventId: null,
                                createdAt:
                                    sound.created_at ||
                                    new Date().toISOString(),
                            });
                        }
                    });
                }

                setMusics(tempMusics);
                saveToStorage("sonora_music", tempMusics);

                const flatFolders: any[] = [];
                apiEventsList.forEach((e: any) => {
                    if (e.folders) {
                        flatFolders.push(...e.folders);
                    }
                });

                const localFolders = flatFolders.map((f: any, i: number) => ({
                    id: i + 1,
                    apiId: f.id,
                    name: f.name,
                    parentId: null as number | null,
                    apiParentId: f.parent,
                    children: [] as FolderNode[],
                }));

                const folderMap = new Map(
                    localFolders.map((f) => [f.apiId, f]),
                );
                const roots: FolderNode[] = [];

                localFolders.forEach((node) => {
                    if (node.apiParentId) {
                        const parentNode = folderMap.get(node.apiParentId);
                        if (parentNode) {
                            node.parentId = parentNode.id;
                            parentNode.children.push(node);
                        } else {
                            roots.push(node);
                        }
                    } else {
                        roots.push(node);
                    }
                });

                setFolders(roots);
                saveToStorage("sonora_folders", roots);
            } catch (err) {
                console.warn(
                    "Falha ao processar os dados do serializer da API, usando cache local.",
                    err,
                );
            }
        }

        syncFromApi();
    }, []);

    useEffect(() => {
        saveToStorage("sonora_events", events);
    }, [events]);

    useEffect(() => {
        const syncedMusics = musics.map((music, index) => ({
            ...music,
            order: index + 1,
        }));

        if (JSON.stringify(syncedMusics) !== JSON.stringify(musics)) {
            setMusics(syncedMusics);
            return;
        }

        saveToStorage("sonora_music", musics);
    }, [musics]);

    useEffect(() => {
        saveToStorage("sonora_folders", folders);
    }, [folders]);

    useEffect(() => {
        saveToStorage("sonora_settings", { displayName });
    }, [displayName]);

    useEffect(() => {
        setEvents((currentEvents) =>
            currentEvents.map((event) => ({
                ...event,
                musicCount: musics.filter((music) => music.eventId === event.id)
                    .length,
            })),
        );
    }, [musics]);

    const currentTabInfo = TAB_LABELS[activeTab];
    const currentAccessEvents = useMemo(() => {
        if (userRole === "admin") {
            return events.map((event) => event.name);
        }

        return normalizeEventAccess(
            accessibleEvents,
            events.map((event) => event.name),
        );
    }, [accessibleEvents, events, userRole]);

    const visibleEventNames = useMemo(() => {
        if (userRole === "admin" || userRole === "cliente") {
            return events.map((event) => event.name);
        }

        return currentAccessEvents;
    }, [currentAccessEvents, events, userRole]);

    const visibleEvents = useMemo(() => {
        return events.filter((event) => {
            if (userRole === "admin") return true;

            return visibleEventNames.includes(event.name);
        });
    }, [events, userRole, visibleEventNames]);

    const visibleMusics = useMemo(() => {
        let filtered = musics.filter((music) => {
            const matchesSearch = [music.artist, music.title, music.notes].some(
                (value) => value.toLowerCase().includes(search.toLowerCase()),
            );

            const matchesFilter =
                filterType === "all" ? true : music.type === filterType;

            const matchesTab =
                activeTab === "fundo"
                    ? music.type === "fundo"
                    : activeTab === "reacoes"
                        ? music.type === "reacao"
                        : activeTab === "favoritos"
                            ? music.favorite
                            : true;

            const musicEventName = music.eventId
                ? events.find((event) => event.id === music.eventId)?.name ||
                music.project
                : music.project;

            const matchesEvent =
                userRole === "admin" ||
                userRole === "cliente" ||
                !musicEventName ||
                visibleEventNames.includes(musicEventName);
            const matchesSelectedEvent =
                selectedEventId === null || music.eventId === selectedEventId;

            return (
                matchesSearch &&
                matchesFilter &&
                matchesTab &&
                matchesEvent &&
                matchesSelectedEvent
            );
        });

        filtered = [...filtered].sort((left, right) => {
            if (userRole === "admin" || userRole === "manager") {
                const eventL =
                    events.find((e) => e.id === left.eventId)?.name || "";
                const eventR =
                    events.find((e) => e.id === right.eventId)?.name || "";
                if (eventL !== eventR) return eventL.localeCompare(eventR);
            }

            if (sortBy === "title")
                return left.title.localeCompare(right.title);
            if (sortBy === "artist")
                return left.artist.localeCompare(right.artist);
            return left.order - right.order;
        });

        return filtered;
    }, [
        activeTab,
        events,
        filterType,
        musics,
        search,
        sortBy,
        userRole,
        visibleEventNames,
        selectedEventId,
    ]);

    const dashboardMetrics = useMemo(() => {
        const totalEvs = visibleEvents.length;
        const totalMus = musics.length;
        const pending = musics.filter((m) => m.status === "pending").length;
        const accepted = musics.filter(
            (m) => m.status === "accepted" || m.status === ("approved" as any),
        ).length;
        const rejected = musics.filter((m) => m.status === "rejected").length;
        const favorites = musics.filter((m) => m.favorite).length;

        const countBg = musics.filter((m) => m.type === "fundo").length;
        const countReact = musics.filter((m) => m.type === "reacao").length;

        const avgMusicsPerEvent =
            totalEvs > 0 ? (totalMus / totalEvs).toFixed(1) : "0";

        return {
            totalEvs,
            totalMus,
            pending,
            accepted,
            rejected,
            favorites,
            countBg,
            countReact,
            avgMusicsPerEvent,
        };
    }, [visibleEvents, musics]);

    async function handleStatusChange(
        id: number,
        status: "pending" | "accepted" | "rejected",
    ) {
        if (!canManageMusic) return;
        const music = musics.find((m) => m.id === id);
        if (!music || !music.orderApiId) return;

        if (status === "rejected") {
            setMusics((current) => current.filter((m) => m.id !== id));
        } else {
            setMusics((current) =>
                current.map((m) => (m.id === id ? { ...m, status } : m)),
            );
        }

        try {
            let updatedOrder: ApiMusicOrder | undefined;
            if (status === "accepted") {
                updatedOrder = await acceptMusicOrder(music.orderApiId);
                toast.success("Música aceita com sucesso.");
            } else if (status === "rejected") {
                updatedOrder = await rejectMusicOrder(music.orderApiId);
                toast.success("Música recusada com sucesso.");
            }

            if (updatedOrder) {
                setMusics((current) =>
                    current.map((m) =>
                        m.id === id
                            ? { ...m, status: updatedOrder.status || status }
                            : m,
                    ),
                );
            }
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            toast.error(
                "Falha ao sincronizar status no servidor. Revertendo alteração local.",
            );
            const original = musics.find((m) => m.id === id);
            if (original) {
                setMusics((current) =>
                    current.map((m) =>
                        m.id === id ? { ...m, status: original.status } : m,
                    ),
                );
            }
        }
    }

    async function openNewEvent() {
        setEditingEventId(null);
        setEventForm({
            name: "",
            organizer: "",
            startDate: "",
            endDate: "",
            managerId: "",
        });
        if (userRole === "admin") {
            try {
                const managersList = await fetchUsers(true);
                setManagers(managersList || []);
            } catch {
                toast.error("Falha ao carregar gerentes.");
            }
        }
        setShowEventModal(true);
    }

    async function handleSaveEvent(event: React.FormEvent) {
        event.preventDefault();

        const duplicateEvent = events.some(
            (item) =>
                item.id !== editingEventId &&
                normalizeText(item.name) === normalizeText(eventForm.name) &&
                item.endDate === eventForm.endDate,
        );
        if (duplicateEvent) {
            toast.error("Já existe um evento igual cadastrado.");
            return;
        }

        const selectedManager = (managers || []).find(
            (m) => m.id === eventForm.managerId,
        );

        if (editingEventId) {
            const existing = events.find((e) => e.id === editingEventId);
            setEvents((current) =>
                current.map((item) =>
                    item.id === editingEventId
                        ? {
                            ...item,
                            name: eventForm.name,
                            organizer:
                                selectedManager?.username ||
                                eventForm.organizer,
                            managerId: eventForm.managerId,
                            startDate: eventForm.startDate,
                            endDate: eventForm.endDate,
                            musicCount: musics.filter(
                                (m) => m.eventId === item.id,
                            ).length,
                        }
                        : item,
                ),
            );
            toast.success("Evento atualizado.");
            if (existing?.apiId) {
                updateEvent(existing.apiId, {
                    event_name: eventForm.name,
                    start_date: eventForm.startDate,
                    end_date: eventForm.endDate,
                    manager: eventForm.managerId || null,
                }).catch(() =>
                    toast.error("Falha ao sincronizar evento com o servidor."),
                );
            }
        } else {
            const localId = Date.now();
            const newEvent: EventItem = {
                id: localId,
                name: eventForm.name,
                organizer: selectedManager?.username || eventForm.organizer,
                managerId: eventForm.managerId,
                startDate: eventForm.startDate,
                endDate: eventForm.endDate,
                status: "ativo",
                musicCount: 0,
            };
            setEvents((current) => [...current, newEvent]);
            toast.success("Evento salvo.");
            if (getAccessToken()) {
                createEvent({
                    event_name: eventForm.name,
                    start_date: eventForm.startDate,
                    end_date: eventForm.endDate,
                    manager: eventForm.managerId || null,
                })
                    .then((apiEvent) => {
                        setEvents((current) =>
                            current.map((e) =>
                                e.id === localId
                                    ? { ...e, apiId: apiEvent.id }
                                    : e,
                            ),
                        );
                    })
                    .catch(() =>
                        toast.error("Falha ao criar evento no servidor."),
                    );
            }
        }

        setShowEventModal(false);
        setEventForm({
            name: "",
            organizer: "",
            startDate: "",
            endDate: "",
            managerId: "",
        });
        setEditingEventId(null);
    }

    async function handleEditEvent(event: EventItem) {
        setEditingEventId(event.id);
        setEventForm({
            name: event.name,
            organizer: event.organizer,
            startDate: event.startDate,
            endDate: event.endDate,
            managerId: event.managerId || "",
        });
        if (userRole === "admin") {
            try {
                const managersList = await fetchUsers(true);
                setManagers(managersList || []);
            } catch {
                toast.error("Falha ao carregar gerentes.");
            }
        }
        setShowEventModal(true);
    }

    function deleteEvent(id: number) {
        const existing = events.find((e) => e.id === id);
        setEvents((current) => current.filter((event) => event.id !== id));
        setMusics((current) =>
            current.map((music) =>
                music.eventId === id ? { ...music, eventId: null } : music,
            ),
        );
        toast.success("Evento removido.");
        if (existing?.apiId) {
            apiDeleteEvent(existing.apiId).catch(() =>
                toast.error("Falha ao remover evento no servidor."),
            );
        }
    }

    function openEvent(event: EventItem) {
        setActiveTab("musicas");
        setSearch("");
        setFilterType("all");
        setSelectedEventId(event.id);
        toast.success(`Abrindo músicas de ${event.name}`);
    }

    function handleOpenMusicModal() {
        setEditingMusic(null);
        setShowMusicModal(true);
    }

    async function handleMusicSave(
        payload: Omit<MusicItem, "thumbnail" | "createdAt"> & { id?: number },
    ) {
        const duplicateMusic = musics.some(
            (music) =>
                music.id !== payload.id &&
                (music.youtubeLink === payload.youtubeLink ||
                    (music.title.toLowerCase() ===
                        payload.title.toLowerCase() &&
                        music.artist.toLowerCase() ===
                        payload.artist.toLowerCase())),
        );
        if (duplicateMusic) {
            toast.error("Essa música já existe no repertório.");
            return;
        }

        if (payload.id) {
            const existing = musics.find((m) => m.id === payload.id);
            if (!existing) return;

            setMusics((current) =>
                current.map((music) =>
                    music.id === payload.id
                        ? {
                            ...music,
                            ...payload,
                            thumbnail: buildThumbnail(payload.youtubeLink),
                        }
                        : music,
                ),
            );
            toast.success("Música atualizada localmente.");

            try {
                let musicApiId = existing.apiId;
                if (!musicApiId && getAccessToken()) {
                    const apiMusic = await createMusic({
                        name: payload.title,
                        url: payload.youtubeLink,
                        singer: payload.artist,
                        observation: payload.notes,
                    });
                    musicApiId = apiMusic.id;
                    setMusics((current) =>
                        current.map((m) =>
                            m.id === payload.id
                                ? { ...m, apiId: musicApiId }
                                : m,
                        ),
                    );
                } else if (musicApiId) {
                    await updateMusic(musicApiId, {
                        name: payload.title,
                        url: payload.youtubeLink,
                        singer: payload.artist,
                        observation: payload.notes,
                    });
                }

                const localEvent = events.find((e) => e.id === payload.eventId);
                if (localEvent?.apiId && musicApiId) {
                    if (existing.orderApiId) {
                        await updateMusicOrder(existing.orderApiId, {
                            event: localEvent.apiId,
                            order: payload.order,
                            category:
                                payload.type === "fundo"
                                    ? "background"
                                    : "interactive",
                        });
                    } else {
                        const apiOrder = await createMusicOrder({
                            music: musicApiId,
                            event: localEvent.apiId,
                            order: payload.order,
                            category:
                                payload.type === "fundo"
                                    ? "background"
                                    : "interactive",
                        });
                        setMusics((current) =>
                            current.map((m) =>
                                m.id === payload.id
                                    ? { ...m, orderApiId: apiOrder.id }
                                    : m,
                            ),
                        );
                    }
                }
                toast.success("Alterações sincronizadas com o servidor.");
            } catch (err) {
                console.error("Erro ao salvar música:", err);
                toast.error("Falha ao sincronizar totalmente com o servidor.");
            }
        } else {
            const localId = Date.now();
            const newMusic: MusicItem = {
                ...payload,
                id: localId,
                thumbnail: buildThumbnail(payload.youtubeLink),
                createdAt: new Date().toISOString(),
            };
            setMusics((current) => [...current, newMusic]);
            toast.success("Música adicionada ao painel.");

            if (getAccessToken()) {
                try {
                    const apiMusic = await createMusic({
                        name: payload.title,
                        url: payload.youtubeLink,
                        singer: payload.artist,
                        observation: payload.notes,
                    });

                    const localEvent = events.find(
                        (e) => e.id === payload.eventId,
                    );
                    if (localEvent?.apiId) {
                        const apiOrder = await createMusicOrder({
                            music: apiMusic.id,
                            event: localEvent.apiId,
                            order: payload.order,
                            category:
                                payload.type === "fundo"
                                    ? "background"
                                    : "interactive",
                        });
                        setMusics((current) =>
                            current.map((m) =>
                                m.id === localId
                                    ? {
                                        ...m,
                                        apiId: apiMusic.id,
                                        orderApiId: apiOrder.id,
                                    }
                                    : m,
                            ),
                        );
                    } else {
                        setMusics((current) =>
                            current.map((m) =>
                                m.id === localId
                                    ? { ...m, apiId: apiMusic.id }
                                    : m,
                            ),
                        );
                    }
                    toast.success("Música e vínculo salvos no servidor.");
                } catch (err) {
                    console.error("Erro ao criar música:", err);
                    toast.error(
                        "Música salva localmente, mas falhou no servidor.",
                    );
                }
            }
        }

        setShowMusicModal(false);
        setEditingMusic(null);
    }

    function handleEditMusic(music: MusicItem) {
        setEditingMusic(music);
        setShowMusicModal(true);
    }

    function handleDeleteMusic(id: number) {
        const existing = musics.find((m) => m.id === id);
        setMusics((current) => current.filter((music) => music.id !== id));
        toast.success("Música removida.");
        if (existing?.orderApiId) {
            deleteMusicOrder(existing.orderApiId).catch(() => { });
        } else if (existing?.apiId) {
            apiDeleteMusic(existing.apiId).catch(() => { });
        }
    }

    function handleToggleFavorite(id: number) {
        setMusics((current) =>
            current.map((music) =>
                music.id === id
                    ? { ...music, favorite: !music.favorite }
                    : music,
            ),
        );
    }

    function handleMoveType(id: number, type: "fundo" | "reacao" | "geral") {
        if (!canManageMusic) return;
        setMusics((current) =>
            current.map((music) =>
                music.id === id ? { ...music, type } : music,
            ),
        );
    }

    async function reorderMusics(targetId: number) {
        if (!canManageMusic) return;
        if (draggedMusicId === null || targetId === draggedMusicId) return;

        const draggedMusic = musics.find((m) => m.id === draggedMusicId);
        if (!draggedMusic) return;

        let resolvedOrder = -1;

        setMusics((current) => {
            const updated = [...current];
            const fromIndex = updated.findIndex(
                (music) => music.id === draggedMusicId,
            );
            const toIndex = updated.findIndex((music) => music.id === targetId);

            if (fromIndex < 0 || toIndex < 0) return current;

            const [item] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, item);

            resolvedOrder = toIndex + 1;

            return updated.map((music, index) => ({
                ...music,
                order: index + 1,
            }));
        });

        if (resolvedOrder > 0 && draggedMusic.orderApiId && getAccessToken()) {
            try {
                await updateMusicOrder(draggedMusic.orderApiId, {
                    order: resolvedOrder,
                });
                toast.success("Ordem sincronizada.");
            } catch {
                toast.error("Falha ao sincronizar ordem no servidor.");
            }
        }

        setDraggedMusicId(null);
    }

    async function handleMoveMusic(musicId: number, folderId: number | null) {
        if (!canManageMusic) return;
        if (musicId <= 0) return;

        const music = musics.find((m) => m.id === musicId);
        if (!music) return;

        setMusics((current) =>
            current.map((m) => (m.id === musicId ? { ...m, folderId } : m)),
        );

        if (getAccessToken() && music.orderApiId) {
            let folderApiId: string | null = null;
            if (folderId !== null) {
                const findFolderApiId = (
                    nodes: FolderNode[],
                ): string | null => {
                    for (const node of nodes) {
                        if (node.id === folderId) return node.apiId || null;
                        const found = findFolderApiId(node.children);
                        if (found) return found;
                    }
                    return null;
                };
                folderApiId = findFolderApiId(folders);
            }

            try {
                await updateMusicOrder(music.orderApiId, {
                    folder: folderApiId,
                });
                toast.success("Música movida com sucesso.");
            } catch {
                toast.error("Falha ao sincronizar movimento no servidor.");
            }
        }
    }

    function handleCreateFolder(parentId: number | null) {
        const name = window.prompt("Nome da pasta");
        if (!name?.trim()) return;

        const localId = Date.now();
        const newFolder: FolderNode = {
            id: localId,
            name: name.trim(),
            parentId,
            children: [],
        };
        setFolders((current) => applyFolderTree(current, parentId, newFolder));
        toast.success("Pasta criada.");

        if (getAccessToken()) {
            const parentFolder = parentId
                ? (function findFolder(
                    nodes: FolderNode[],
                ): FolderNode | undefined {
                    for (const n of nodes) {
                        if (n.id === parentId) return n;
                        const found = findFolder(n.children);
                        if (found) return found;
                    }
                })(folders)
                : undefined;

            const eventApiId = events.find((e) => e.apiId)?.apiId;
            const parentApiId = parentFolder?.apiId;
            if (eventApiId) {
                createFolder({
                    name: name.trim(),
                    event: eventApiId,
                    parent: parentApiId ?? null,
                })
                    .then((apif) => {
                        setFolders((current) =>
                            updateFolderTree(current, localId, (node) => ({
                                ...node,
                                apiId: apif.id,
                            })),
                        );
                    })
                    .catch(() => { });
            }
        }
    }

    function handleEditFolder(folder: FolderNode) {
        const name = window.prompt("Editar nome da pasta", folder.name);
        if (!name?.trim()) return;

        setFolders((current) =>
            updateFolderTree(current, folder.id, (node) => ({
                ...node,
                name: name.trim(),
            })),
        );
        if (folder.apiId) {
            updateFolder(folder.apiId, { name: name.trim() }).catch(() => { });
        }
    }

    function handleDeleteFolder(folderId: number) {
        const node = (function find(
            nodes: FolderNode[],
        ): FolderNode | undefined {
            for (const n of nodes) {
                if (n.id === folderId) return n;
                const found = find(n.children);
                if (found) return found;
            }
        })(folders);
        setFolders((current) => removeFolderTree(current, folderId));
        setMusics((current) =>
            current.map((music) =>
                music.folderId === folderId
                    ? { ...music, folderId: null }
                    : music,
            ),
        );
        toast.success("Pasta removida.");
        if (node?.apiId) {
            apiDeleteFolder(node.apiId).catch(() => { });
        }
    }

    async function handleAdminAccessSave(event: React.FormEvent) {
        event.preventDefault();

        if (!adminSelectedEmail) {
            toast.error("Selecione um usuário para gerenciar.");
            return;
        }

        const selectedUser = (adminUsers || []).find(
            (u) => u.email === adminSelectedEmail,
        );
        if (!selectedUser) return;

        const lockedAdminUser = adminSelectedEmail === "admin@admin";

        if (getAccessToken()) {
            const eventIds = events
                .filter((e) => adminSelectedProjects.includes(e.name))
                .map((e) => e.apiId)
                .filter((id): id is string => !!id);

            try {
                await updateUser(selectedUser.id, {
                    is_manager: lockedAdminUser
                        ? false
                        : adminSelectedRole === "manager",
                    is_admin: lockedAdminUser
                        ? true
                        : adminSelectedRole === "admin",
                    event_ids: eventIds,
                });
                toast.success("Permissões atualizadas no servidor.");
                refreshAdminUsers();
            } catch (err) {
                toast.error("Falha ao sincronizar permissões com o servidor.");
            }
        }

        const updatedUsers = (adminUsers || []).map((user) =>
            user.email === adminSelectedEmail
                ? {
                    ...user,
                    is_manager: lockedAdminUser
                        ? false
                        : adminSelectedRole === "manager",
                    is_admin: lockedAdminUser
                        ? true
                        : adminSelectedRole === "admin",
                }
                : user,
        );

        const updatedUser = updatedUsers.find(
            (user) => user.email === adminSelectedEmail,
        );

        if (updatedUser && updatedUser.email === userEmail) {
            const role: UserRole = updatedUser.is_admin
                ? "admin"
                : updatedUser.is_manager
                    ? "manager"
                    : "cliente";
            setUserRole(role);
            setAccessibleEvents(adminSelectedProjects);

            const updatedLoggedUser = {
                email: updatedUser.email,
                displayName: updatedUser.username,
                role: role,
                projects: adminSelectedProjects,
            };

            localStorage.setItem(
                "loggedUser",
                JSON.stringify(updatedLoggedUser),
            );
        }
    }

    function handleAdminUserChange(value: string) {
        setAdminSelectedEmail(value);
        setShowEventChecklist(false);

        if (!value) {
            setAdminSelectedRole("cliente");
            setAdminSelectedProjects([]);
            return;
        }

        const user = (adminUsers || []).find((item) => item.email === value);

        if (user?.email === "admin@admin") {
            setAdminSelectedRole("admin");
            setAdminSelectedProjects(events.map((event) => event.name));
            return;
        }

        const role: UserRole = user?.is_admin
            ? "admin"
            : user?.is_manager
                ? "manager"
                : "cliente";
        setAdminSelectedRole(role);
        const projects = user?.my_events?.map((e) => e.event_name) || [];
        setAdminSelectedProjects(
            normalizeEventAccess(
                projects,
                events.map((event) => event.name),
            ),
        );
    }

    useEffect(() => {
        if (activeTab === "configuracoes" && userRole === "admin") {
            refreshAdminUsers();
        }
    }, [activeTab, userRole]);

    const musicSummary = {
        total: visibleMusics.length,
        favorites: visibleMusics.filter((music) => music.favorite).length,
        fundo: visibleMusics.filter((music) => music.type === "fundo").length,
        reacoes: visibleMusics.filter((music) => music.type === "reacao")
            .length,
    };

    return (
        <div className="dashboard-shell">
            <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                userEmail={userEmail}
                userRole={userRole}
            />

            <div className="dashboard-main">
                <Topbar
                    title={currentTabInfo.title}
                    subtitle={currentTabInfo.subtitle}
                    email={userEmail}
                    onLogout={() => {
                        apiLogout();
                        setScreen("login");
                    }}
                />

                <main className="dashboard-body">
                    <section className="dashboard-hero">
                        <div>
                            <h2></h2>
                            <p className="hero-kicker">Central de operação</p>
                            <h2>Bem-vindo(a)</h2>
                            <p className="hero-copy">
                                Acesse eventos, músicas, pastas e configurações
                                em um ambiente premium e responsivo.
                            </p>
                        </div>

                        <div className="hero-stats-grid">
                            <div className="metric-card">
                                <span className="metric-value">
                                    {musicSummary.total}
                                </span>
                                <span className="metric-label">Músicas</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">
                                    {musicSummary.favorites}
                                </span>
                                <span className="metric-label">Favoritos</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">
                                    {musicSummary.fundo}
                                </span>
                                <span className="metric-label">Fundo</span>
                            </div>
                            <div className="metric-card">
                                <span className="metric-value">
                                    {musicSummary.reacoes}
                                </span>
                                <span className="metric-label">Reações</span>
                            </div>
                        </div>
                    </section>

                    {activeTab === "dashboard" && (
                        <>
                            {canManageMusic ? (
                                <section className="panel">
                                    <div className="panel-header">
                                        <div>
                                            <p className="panel-eyebrow">Métricas em Tempo Real</p>
                                            <h3>Painel Analítico</h3>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={fetchDashboardData}
                                            disabled={loadingDashboard}
                                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                                        >
                                            {loadingDashboard ? "Atualizando..." : "Atualizar Dados"}
                                        </button>
                                    </div>

                                    {loadingDashboard && (
                                        <div style={{ padding: "40px", textAlign: "center", color: "#8fa0bc" }}>
                                            <p>Carregando dados consolidados do servidor...</p>
                                        </div>
                                    )}

                                    {dashboardError && (
                                        <div style={{
                                            padding: "20px",
                                            backgroundColor: "rgba(244, 67, 54, 0.1)",
                                            border: "1px solid rgba(244, 67, 54, 0.3)",
                                            borderRadius: "8px",
                                            color: "#f44336",
                                            marginBottom: "24px"
                                        }}>
                                            <p>{dashboardError}</p>
                                        </div>
                                    )}

                                    {!loadingDashboard && !dashboardError && !dashboardApiData && (
                                        <p className="empty-state">Nenhum dado disponível no momento.</p>
                                    )}

                                    {!loadingDashboard && !dashboardError && dashboardApiData && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                                            {/* Grid de Cards Principais */}
                                            <div className="settings-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>

                                                <article className="settings-card">
                                                    <h4>Usuários & Planos</h4>
                                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0 6px" }}>
                                                        <span>Total de Usuários:</span>
                                                        <strong style={{ color: "var(--accent)" }}>
                                                            {dashboardApiData.users_and_plans?.total_users ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                        <span>Planos Ativos:</span>
                                                        <strong style={{ color: "#4caf50" }}>
                                                            {dashboardApiData.users_and_plans?.active_plans ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <span>Planos Expirados:</span>
                                                        <strong style={{ color: "#f44336" }}>
                                                            {dashboardApiData.users_and_plans?.expired_plans ?? 0}
                                                        </strong>
                                                    </div>
                                                </article>

                                                <article className="settings-card">
                                                    <h4>Eventos</h4>
                                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0 6px" }}>
                                                        <span>Total de Eventos:</span>
                                                        <strong style={{ color: "var(--accent)" }}>
                                                            {dashboardApiData.events?.total_events ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                        <span>Ativos:</span>
                                                        <strong style={{ color: "#4caf50" }}>
                                                            {dashboardApiData.events?.active_events ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <span>Inativos:</span>
                                                        <strong style={{ color: "#8fa0bc" }}>
                                                            {dashboardApiData.events?.inactive_events ?? 0}
                                                        </strong>
                                                    </div>
                                                </article>

                                                <article className="settings-card">
                                                    <h4>Músicas & Pedidos</h4>
                                                    <div style={{ display: "flex", justifyContent: "space-between", margin: "12px 0 6px" }}>
                                                        <span>Músicas Enviadas:</span>
                                                        <strong style={{ color: "var(--accent)" }}>
                                                            {dashboardApiData.musics_and_orders?.total_uploaded_musics ?? 0}
                                                        </strong>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        <span>Total de Pedidos:</span>
                                                        <strong style={{ color: "var(--accent)" }}>
                                                            {dashboardApiData.musics_and_orders?.total_orders ?? 0}
                                                        </strong>
                                                    </div>
                                                </article>
                                            </div>

                                            {/* Seção do Gráfico e Distribuição */}
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                                                gap: "24px",
                                                marginTop: "12px"
                                            }}>

                                                {/* Gráfico SVG de Distribuição de Status dos Pedidos */}
                                                <div className="settings-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                                                    <h4 style={{ alignSelf: "flex-start", marginBottom: "20px" }}>Status dos Pedidos</h4>

                                                    {(() => {
                                                        const pending = dashboardApiData.musics_and_orders?.status_distribution?.pending ?? 0;
                                                        const accepted = dashboardApiData.musics_and_orders?.status_distribution?.accepted ?? 0;
                                                        const rejected = dashboardApiData.musics_and_orders?.status_distribution?.rejected ?? 0;
                                                        const total = pending + accepted + rejected;

                                                        if (total === 0) {
                                                            return <p style={{ color: "#8fa0bc", fontSize: "0.9rem" }}>Sem pedidos para exibir o gráfico.</p>;
                                                        }

                                                        const radius = 50;
                                                        const circumference = 2 * Math.PI * radius;

                                                        const pctAccepted = (accepted / total) * circumference;
                                                        const pctPending = (pending / total) * circumference;
                                                        const pctRejected = (rejected / total) * circumference;

                                                        return (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "32px", width: "100%", justifyContent: "space-around", flexWrap: "wrap" }}>
                                                                <svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                                                                    <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />

                                                                    {accepted > 0 && (
                                                                        <circle
                                                                            cx="60" cy="60" r={radius} fill="transparent"
                                                                            stroke="#4caf50" strokeWidth="12"
                                                                            strokeDasharray={`${pctAccepted} ${circumference}`}
                                                                        />
                                                                    )}

                                                                    {pending > 0 && (
                                                                        <circle
                                                                            cx="60" cy="60" r={radius} fill="transparent"
                                                                            stroke="#ffeb3b" strokeWidth="12"
                                                                            strokeDasharray={`${pctPending} ${circumference}`}
                                                                            strokeDashoffset={-pctAccepted}
                                                                        />
                                                                    )}

                                                                    {rejected > 0 && (
                                                                        <circle
                                                                            cx="60" cy="60" r={radius} fill="transparent"
                                                                            stroke="#f44336" strokeWidth="12"
                                                                            strokeDasharray={`${pctRejected} ${circumference}`}
                                                                            strokeDashoffset={-(pctAccepted + pctPending)}
                                                                        />
                                                                    )}
                                                                </svg>

                                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                                                                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#4caf50" }} />
                                                                        <span>Aprovados: <strong>{accepted}</strong></span>
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                                                                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffeb3b" }} />
                                                                        <span>Pendentes: <strong>{pending}</strong></span>
                                                                    </div>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                                                                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f44336" }} />
                                                                        <span>Recusados: <strong>{rejected}</strong></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Distribuição de Planos Adquiridos */}
                                                <div className="settings-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                                    <h4 style={{ marginBottom: "16px" }}>Distribuição por Tipo de Plano</h4>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                        {[
                                                            { label: "Anual", value: dashboardApiData.users_and_plans?.distribution?.anual ?? 0, color: "var(--accent)" },
                                                            { label: "Mensal", value: dashboardApiData.users_and_plans?.distribution?.mensal ?? 0, color: "#9c27b0" },
                                                            { label: "Experimentação", value: dashboardApiData.users_and_plans?.distribution?.experimentacao ?? 0, color: "#607d8b" }
                                                        ].map((plan) => {
                                                            const totalPlans =
                                                                (dashboardApiData.users_and_plans?.distribution?.anual ?? 0) +
                                                                (dashboardApiData.users_and_plans?.distribution?.mensal ?? 0) +
                                                                (dashboardApiData.users_and_plans?.distribution?.experimentacao ?? 0);
                                                            const planPct = totalPlans > 0 ? (plan.value / totalPlans) * 100 : 0;

                                                            return (
                                                                <div key={plan.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                                                        <span>{plan.label}</span>
                                                                        <span><strong>{plan.value}</strong> ({planPct.toFixed(0)}%)</span>
                                                                    </div>
                                                                    <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                                                        <div style={{ width: `${planPct}%`, height: "100%", backgroundColor: plan.color, borderRadius: "4px" }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Eventos Ativos em Destaque */}
                                            <div className="settings-card">
                                                <h4 style={{ marginBottom: "16px", color: "var(--accent)" }}>Eventos em Destaque por Pedidos</h4>
                                                <div className="music-list-stack" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {dashboardApiData.events?.top_active_events_by_orders && dashboardApiData.events.top_active_events_by_orders.length > 0 ? (
                                                        dashboardApiData.events.top_active_events_by_orders.map((event: any) => (
                                                            <div
                                                                key={event.id}
                                                                style={{
                                                                    padding: "16px",
                                                                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center"
                                                                }}
                                                            >
                                                                <div>
                                                                    <strong style={{ fontSize: "0.95rem" }}>{event.event_name}</strong>
                                                                    <p style={{ fontSize: "0.8rem", color: "#8fa0bc", marginTop: "4px" }}>
                                                                        Período: {event.start_date} até {event.end_date}
                                                                    </p>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: "0.85rem",
                                                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                                                    padding: "4px 10px",
                                                                    borderRadius: "12px"
                                                                }}>
                                                                    {event.total_orders} pedidos
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="empty-state">Nenhum evento ativo com pedidos registrado no momento.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            ) : (
                                <section className="panel">
                                    <p className="empty-state">
                                        Você não possui permissões administrativas para acessar os dados consolidados do painel.
                                    </p>
                                </section>
                            )}
                        </>
                    )}

                    {activeTab === "eventos" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">Gestão</p>
                                    <h3>Eventos</h3>
                                </div>
                                {canManageMusic && (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={openNewEvent}
                                    >
                                        Novo Evento
                                    </button>
                                )}
                            </div>

                            <div className="event-grid">
                                {(visibleEvents || []).map((event) => (
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

                    {activeTab === "musicas" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">Biblioteca</p>
                                    <h3>Músicas</h3>
                                </div>

                                <div className="toolbar-stack">
                                    <select
                                        className="toolbar-select"
                                        value={selectedEventId ?? ""}
                                        onChange={(event) =>
                                            setSelectedEventId(
                                                event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Todos os eventos
                                        </option>
                                        {(visibleEvents || []).map((event) => (
                                            <option
                                                key={event.id}
                                                value={event.id}
                                            >
                                                {event.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="search"
                                        className="toolbar-input"
                                        placeholder="Buscar por artista, música ou observações"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />

                                    <select
                                        className="toolbar-select"
                                        value={filterType}
                                        onChange={(event) =>
                                            setFilterType(
                                                event.target.value as
                                                | "all"
                                                | "fundo"
                                                | "reacao",
                                            )
                                        }
                                    >
                                        <option value="all">Todos</option>
                                        <option value="fundo">Fundo</option>
                                        <option value="reacao">Reação</option>
                                    </select>

                                    <select
                                        className="toolbar-select"
                                        value={sortBy}
                                        onChange={(event) =>
                                            setSortBy(
                                                event.target.value as
                                                | "order"
                                                | "title"
                                                | "artist",
                                            )
                                        }
                                    >
                                        <option value="order">
                                            Ordenar por ordem
                                        </option>
                                        <option value="title">
                                            Ordenar por título
                                        </option>
                                        <option value="artist">
                                            Ordenar por artista
                                        </option>
                                    </select>

                                    {getAccessToken() && (
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={handleOpenMusicModal}
                                        >
                                            Adicionar Música
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="music-list-stack">
                                {(visibleEvents || []).map((event) => {
                                    const eventMusics = (visibleMusics || []).filter(
                                        (m) => m.eventId === event.id,
                                    );
                                    if (eventMusics.length === 0) return null;

                                    return (
                                        <div
                                            key={event.id}
                                            className="event-music-group"
                                            style={{ marginBottom: "24px" }}
                                        >
                                            <h4
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.05)",
                                                    borderRadius: "8px",
                                                    marginBottom: "12px",
                                                    color: "var(--accent)",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                Evento: {event.name}
                                                <span
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        color: "#8fa0bc",
                                                    }}
                                                >
                                                    {eventMusics.length} músicas
                                                </span>
                                            </h4>
                                            <div className="music-list-stack">
                                                {eventMusics.map((music) => (
                                                    <MusicCard
                                                        key={music.id}
                                                        music={music}
                                                        eventName={event.name}
                                                        canManage={
                                                            canManageMusic
                                                        }
                                                        onEdit={handleEditMusic}
                                                        onDelete={
                                                            handleDeleteMusic
                                                        }
                                                        onToggleFavorite={
                                                            handleToggleFavorite
                                                        }
                                                        onPlay={(item) =>
                                                            setPlayerMusic(item)
                                                        }
                                                        onMoveType={
                                                            handleMoveType
                                                        }
                                                        onStatusChange={
                                                            handleStatusChange
                                                        }
                                                        onDragStart={
                                                            setDraggedMusicId
                                                        }
                                                        onDrop={reorderMusics}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {(visibleMusics || []).filter((m) => !m.eventId)
                                    .length > 0 && (
                                        <div className="event-music-group">
                                            <h4
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.05)",
                                                    borderRadius: "8px",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                Sem Evento
                                            </h4>
                                            <div className="music-list-stack">
                                                {(visibleMusics || [])
                                                    .filter((m) => !m.eventId)
                                                    .map((music) => (
                                                        <MusicCard
                                                            key={music.id}
                                                            music={music}
                                                            canManage={
                                                                canManageMusic
                                                            }
                                                            onEdit={handleEditMusic}
                                                            onDelete={
                                                                handleDeleteMusic
                                                            }
                                                            onToggleFavorite={
                                                                handleToggleFavorite
                                                            }
                                                            onPlay={(item) =>
                                                                setPlayerMusic(item)
                                                            }
                                                            onMoveType={
                                                                handleMoveType
                                                            }
                                                            onStatusChange={
                                                                handleStatusChange
                                                            }
                                                            onDragStart={
                                                                setDraggedMusicId
                                                            }
                                                            onDrop={reorderMusics}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                {(visibleMusics || []).length === 0 && (
                                    <p className="empty-state">
                                        Nenhuma música encontrada.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === "fundo" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">
                                        Categorização
                                    </p>
                                    <h3>Música de Fundo</h3>
                                </div>
                            </div>

                            <div className="music-list-stack">
                                {(visibleEvents || []).map((event) => {
                                    const eventMusics = (visibleMusics || []).filter(
                                        (m) => m.eventId === event.id,
                                    );
                                    if (eventMusics.length === 0) return null;

                                    return (
                                        <div
                                            key={event.id}
                                            className="event-music-group"
                                            style={{ marginBottom: "24px" }}
                                        >
                                            <h4
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.05)",
                                                    borderRadius: "8px",
                                                    marginBottom: "12px",
                                                    color: "var(--accent)",
                                                }}
                                            >
                                                Evento: {event.name}
                                            </h4>
                                            <div className="music-list-stack">
                                                {eventMusics.map((music) => (
                                                    <MusicCard
                                                        key={music.id}
                                                        music={music}
                                                        eventName={event.name}
                                                        canManage={
                                                            canManageMusic
                                                        }
                                                        onEdit={handleEditMusic}
                                                        onDelete={
                                                            handleDeleteMusic
                                                        }
                                                        onToggleFavorite={
                                                            handleToggleFavorite
                                                        }
                                                        onPlay={(item) =>
                                                            setPlayerMusic(item)
                                                        }
                                                        onMoveType={
                                                            handleMoveType
                                                        }
                                                        onStatusChange={
                                                            handleStatusChange
                                                        }
                                                        onDragStart={
                                                            setDraggedMusicId
                                                        }
                                                        onDrop={reorderMusics}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeTab === "reacoes" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">
                                        Categorização
                                    </p>
                                    <h3>Reações</h3>
                                </div>
                            </div>

                            <div className="music-list-stack">
                                {(visibleEvents || []).map((event) => {
                                    const eventMusics = (visibleMusics || []).filter(
                                        (m) => m.eventId === event.id,
                                    );
                                    if (eventMusics.length === 0) return null;

                                    return (
                                        <div
                                            key={event.id}
                                            className="event-music-group"
                                            style={{ marginBottom: "24px" }}
                                        >
                                            <h4
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.05)",
                                                    borderRadius: "8px",
                                                    marginBottom: "12px",
                                                    color: "var(--accent)",
                                                }}
                                            >
                                                Evento: {event.name}
                                            </h4>
                                            <div className="music-list-stack">
                                                {eventMusics.map((music) => (
                                                    <MusicCard
                                                        key={music.id}
                                                        music={music}
                                                        eventName={event.name}
                                                        canManage={
                                                            canManageMusic
                                                        }
                                                        onEdit={handleEditMusic}
                                                        onDelete={
                                                            handleDeleteMusic
                                                        }
                                                        onToggleFavorite={
                                                            handleToggleFavorite
                                                        }
                                                        onPlay={(item) =>
                                                            setPlayerMusic(item)
                                                        }
                                                        onMoveType={
                                                            handleMoveType
                                                        }
                                                        onStatusChange={
                                                            handleStatusChange
                                                        }
                                                        onDragStart={
                                                            setDraggedMusicId
                                                        }
                                                        onDrop={reorderMusics}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeTab === "pastas" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">Organização</p>
                                    <h3>Pastas</h3>
                                </div>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleCreateFolder(null)}
                                >
                                    Criar pasta
                                </button>
                            </div>

                            <FolderTree
                                folders={folders || []}
                                musics={musics || []}
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

                    {activeTab === "favoritos" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">
                                        Preferências
                                    </p>
                                    <h3>Favoritos</h3>
                                </div>
                            </div>

                            <div className="music-list-stack">
                                {(visibleEvents || []).map((event) => {
                                    const eventMusics = (visibleMusics || []).filter(
                                        (m) => m.eventId === event.id,
                                    );
                                    if (eventMusics.length === 0) return null;

                                    return (
                                        <div
                                            key={event.id}
                                            className="event-music-group"
                                            style={{ marginBottom: "24px" }}
                                        >
                                            <h4
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.05)",
                                                    borderRadius: "8px",
                                                    marginBottom: "12px",
                                                    color: "var(--accent)",
                                                }}
                                            >
                                                Evento: {event.name}
                                            </h4>
                                            <div className="music-list-stack">
                                                {eventMusics.map((music) => (
                                                    <MusicCard
                                                        key={music.id}
                                                        music={music}
                                                        eventName={event.name}
                                                        canManage={
                                                            canManageMusic
                                                        }
                                                        onEdit={handleEditMusic}
                                                        onDelete={
                                                            handleDeleteMusic
                                                        }
                                                        onToggleFavorite={
                                                            handleToggleFavorite
                                                        }
                                                        onPlay={(item) =>
                                                            setPlayerMusic(item)
                                                        }
                                                        onMoveType={
                                                            handleMoveType
                                                        }
                                                        onStatusChange={
                                                            handleStatusChange
                                                        }
                                                        onDragStart={
                                                            setDraggedMusicId
                                                        }
                                                        onDrop={reorderMusics}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {activeTab === "configuracoes" && (
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <p className="panel-eyebrow">
                                        Preferências
                                    </p>
                                    <h3>Configurações</h3>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <article className="settings-card">
                                    <h4>Acesso atual</h4>
                                    <p>
                                        Perfil e eventos visíveis para esta
                                        conta.
                                    </p>
                                    <p className="hero-copy">
                                        Perfil:{" "}
                                        {userRole === "admin"
                                            ? "Administrador"
                                            : userRole === "manager"
                                                ? "Gerente"
                                                : "Cliente"}
                                    </p>
                                    <div className="project-chip-list">
                                        {(currentAccessEvents.length > 0
                                            ? currentAccessEvents
                                            : ["Nenhum evento atribuído"]
                                        ).map((eventName) => (
                                            <span
                                                key={eventName}
                                                className="project-chip"
                                            >
                                                {eventName}
                                            </span>
                                        ))}
                                    </div>
                                </article>

                                {userRole === "admin" && (
                                    <article className="settings-card">
                                        <h4>Administração de acessos</h4>
                                        <p>
                                            Defina o perfil e os eventos
                                            visíveis para cada usuário.
                                        </p>
                                        <form
                                            className="admin-access-form"
                                            onSubmit={handleAdminAccessSave}
                                        >
                                            <label className="field-block">
                                                <span>Usuário</span>
                                                <select
                                                    className="toolbar-select"
                                                    value={adminSelectedEmail}
                                                    onChange={(event) =>
                                                        handleAdminUserChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Selecione um usuário
                                                    </option>
                                                    {(adminUsers || []).map((user) => (
                                                        <option
                                                            key={user.email}
                                                            value={user.email}
                                                        >
                                                            {user.email}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="field-block">
                                                <span>Perfil</span>
                                                <select
                                                    className="toolbar-select"
                                                    value={adminSelectedRole}
                                                    disabled={
                                                        adminSelectedEmail ===
                                                        "admin@admin"
                                                    }
                                                    onChange={(event) =>
                                                        setAdminSelectedRole(
                                                            event.target
                                                                .value as UserRole,
                                                        )
                                                    }
                                                >
                                                    <option value="admin">
                                                        Administrador
                                                    </option>
                                                    <option value="manager">
                                                        Gerente
                                                    </option>
                                                    <option value="cliente">
                                                        Cliente
                                                    </option>
                                                </select>
                                            </label>

                                            <div className="field-block">
                                                <span>Evento</span>
                                                <button
                                                    type="button"
                                                    className="toolbar-select"
                                                    disabled={
                                                        adminSelectedEmail ===
                                                        "admin@admin"
                                                    }
                                                    onClick={() =>
                                                        setShowEventChecklist(
                                                            (current) =>
                                                                !current,
                                                        )
                                                    }
                                                >
                                                    {adminSelectedProjects.length >
                                                        0
                                                        ? adminSelectedProjects.join(
                                                            ", ",
                                                        )
                                                        : "Selecionar eventos"}
                                                </button>

                                                {showEventChecklist && (
                                                    <div className="project-checkbox-grid">
                                                        {(events || []).map((event) => (
                                                            <label
                                                                key={event.id}
                                                                className="project-checkbox-item"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={adminSelectedProjects.includes(
                                                                        event.name,
                                                                    )}
                                                                    disabled={
                                                                        adminSelectedEmail ===
                                                                        "admin@admin"
                                                                    }
                                                                    onChange={() => {
                                                                        setAdminSelectedProjects(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current.includes(
                                                                                    event.name,
                                                                                )
                                                                                    ? current.filter(
                                                                                        (
                                                                                            item,
                                                                                        ) =>
                                                                                            item !==
                                                                                            event.name,
                                                                                    )
                                                                                    : [
                                                                                        ...current,
                                                                                        event.name,
                                                                                    ],
                                                                        );
                                                                    }}
                                                                />
                                                                <span>
                                                                    {event.name}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                disabled={
                                                    adminSelectedEmail ===
                                                    "admin@admin"
                                                }
                                            >
                                                Salvar permissões
                                            </button>
                                        </form>
                                    </article>
                                )}

                                <article className="settings-card">
                                    <h4>Logout</h4>
                                    <p>
                                        Encerre sua sessão e volte para a tela
                                        de login.
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => {
                                            apiLogout();
                                            setScreen("login");
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
                    setShowMusicModal(false);
                    setEditingMusic(null);
                }}
                events={events || []}
                editingMusic={editingMusic}
                defaultEventId={selectedEventId}
                onSave={handleMusicSave}
            />

            <PlayerModal
                open={!!playerMusic}
                onClose={() => setPlayerMusic(null)}
                youtubeLink={
                    playerMusic ? buildEmbedUrl(playerMusic.youtubeLink) : ""
                }
                title={
                    playerMusic
                        ? `${playerMusic.title} — ${playerMusic.artist}`
                        : ""
                }
            />

            {showEventModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowEventModal(false)}
                >
                    <div
                        className="modal-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <p className="modal-kicker">Eventos</p>
                                <h2>
                                    {editingEventId
                                        ? "Editar evento"
                                        : "Novo evento"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setShowEventModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleSaveEvent}>
                            <label className="field-block">
                                <span>Nome do evento</span>
                                <input
                                    type="text"
                                    required
                                    value={eventForm.name}
                                    onChange={(event) =>
                                        setEventForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            {userRole === "admin" && (
                                <label className="field-block">
                                    <span>Gerente</span>
                                    <select
                                        value={eventForm.managerId}
                                        onChange={(event) =>
                                            setEventForm((current) => ({
                                                ...current,
                                                managerId: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            Selecione um gerente
                                        </option>
                                        {(managers || []).map((manager) => (
                                            <option
                                                key={manager.id}
                                                value={manager.id}
                                            >
                                                {manager.username} (
                                                {manager.email})
                                            </option>
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
                                    onChange={(event) =>
                                        setEventForm((current) => ({
                                            ...current,
                                            startDate: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="field-block">
                                <span>Data de Fim</span>
                                <input
                                    type="date"
                                    required
                                    value={eventForm.endDate}
                                    onChange={(event) =>
                                        setEventForm((current) => ({
                                            ...current,
                                            endDate: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <div className="modal-actions-row">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowEventModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
