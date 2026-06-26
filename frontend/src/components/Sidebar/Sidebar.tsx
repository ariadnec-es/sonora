import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getAccessToken, getTokenExpiration } from "../../services/api";

export type DashboardTab =
    | "eventos"
    | "musicas"
    | "fundo"
    | "reacoes"
    | "pastas"
    | "favoritos"
    | "configuracoes"
    | "dashboard";

interface SidebarProps {
    activeTab: DashboardTab;
    onSelectTab: Dispatch<SetStateAction<DashboardTab>>;
    userEmail: string;
    userRole: string;
}

const menuItems: { key: DashboardTab; label: string }[] = [
    { key: "eventos", label: "Eventos" },
    { key: "musicas", label: "Músicas" },
    { key: "fundo", label: "Música de Fundo" },
    { key: "reacoes", label: "Reações" },
    { key: "pastas", label: "Pastas" },
    { key: "favoritos", label: "Favoritos" },
    { key: "configuracoes", label: "Configurações" },
    { key: "dashboard", label: "Dashboard" },
];

export default function Sidebar({
    activeTab,
    onSelectTab,
    userEmail,
    userRole,
}: SidebarProps) {
    const [expiresIn, setExpiresIn] = useState<string | null>(null);

    useEffect(() => {
        const updateCountdown = () => {
            const token = getAccessToken();
            if (!token) {
                setExpiresIn(null);
                return;
            }

            const exp = getTokenExpiration(token);
            if (!exp) {
                setExpiresIn(null);
                return;
            }

            const now = Date.now();
            const diff = exp - now;

            if (diff <= 0) {
                setExpiresIn("Expirado");
                return;
            }

            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setExpiresIn(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const filteredItems = menuItems.filter((item) => {
        if (userRole === "admin" || userRole === "manager") return true;
        // Cliente só vê o básico
        return ["eventos", "musicas", "favoritos", "configuracoes"].includes(
            item.key,
        );
    });

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-header">
                <div className="brand-mark">S</div>
                <div>
                    <h1 className="brand-title">SONORA</h1>
                </div>
            </div>

            <nav className="sidebar-nav" aria-label="Navegação principal">
                {filteredItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`sidebar-link ${activeTab === item.key ? "active" : ""}`}
                        onClick={() => onSelectTab(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-chip">
                    <span className="sidebar-user-avatar">
                        {userEmail.charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <p className="sidebar-user-label">Usuário ativo</p>
                        <p className="sidebar-user-email">{userEmail}</p>
                        {expiresIn && (
                            <p
                                style={{
                                    fontSize: "0.6rem",
                                    color: "#a5b4d0",
                                    marginTop: "4px",
                                }}
                            >
                                Sessão expira em: {expiresIn}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
