const supabaseUrl = "https://kxwhupsikhxngqincyek.supabase.co"
const supabaseKey = "sb_publishable_PJepmljkI2RLjWIj9_rsug_BmWn3QSv"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

function formatarData(data) {
    if (!data) return "Data não disponível";
    try {
        const d = new Date(data);
        return d.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo"
        });
    } catch (e) {
        return data;
    }
}

function corEvento(evento) {
    if (!evento) return "evento";
    const e = evento.toLowerCase();
    if (e.includes("domingo")) return "domingo";
    if (e.includes("terça") || e.includes("terca")) return "terca";
    if (e.includes("quinta")) return "quinta";
    return "evento";
}

async function carregar() {
    try {
        const lista = document.getElementById("lista");
        if (!lista) return;
        lista.innerHTML = "Carregando...";

        const { data, error } = await supabaseClient
            .from("playbacks")
            .select("*")
            .order("data_envio_play", { ascending: false });

        if (error) throw error;

        lista.innerHTML = "";
        const grupos = {};

        data.forEach(p => {
            // Criando a chave de agrupamento com segurança
            const dataObjeto = new Date(p.data_envio_play);
            const dataDia = dataObjeto.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
            const chave = `${p.evento_play}_${p.nomep_play}_${dataDia}`;

            if (!grupos[chave]) {
                grupos[chave] = {
                    nome: p.nomep_play || "Anônimo",
                    evento: p.evento_play || "Evento",
                    data: p.data_envio_play,
                    musicas: []
                };
            }
            grupos[chave].musicas.push(p);
        });

        Object.values(grupos).forEach(grupo => {
            const card = document.createElement("div");
            card.className = "card";

            let html = `
                <div class="tag ${corEvento(grupo.evento)}">
                    ${grupo.evento.toUpperCase()}
                </div>
                <div class="enviado">
                    ENVIADO POR: ${grupo.nome.toUpperCase()}
                </div>
            `;

            grupo.musicas.forEach((m, i) => {
                html += `
                    <div class="musica">
                        <div class="titulo">
                            MÚSICA ${i + 1}: ${(m.nomeh_play || "Sem título").toUpperCase()} - ${m.cantor_play || "Desconhecido"}
                        </div>
                `;

                if (m.arquivo_url_play) {
                    html += `<audio controls><source src="${m.arquivo_url_play}"></audio>`;
                }

                if (m.youtube_url_play) {
                    html += `
                        <a class="botaoYoutube" target="_blank" href="${m.youtube_url_play}">
                            ABRIR LINK DO PLAYBACK
                        </a>
                    `;
                }

                html += `<div class="obs">OBSERVAÇÕES: ${m.obs_play ?? ""}</div></div>`;
            });

            html += `<div class="dataEnvio">${formatarData(grupo.data)}</div>`;
            card.innerHTML = html;
            lista.appendChild(card);
        });
    } catch (err) {
        console.error("Erro ao carregar:", err);
        document.getElementById("lista").innerHTML = "Erro ao carregar os dados.";
    }
}

carregar();