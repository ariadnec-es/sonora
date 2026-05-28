const addBtn = document.getElementById("add")
const musicasContainer = document.getElementById("musicas")
const eventoSelect = document.getElementById("evento_play")

async function loadEvents() {
    try {
        const events = await apiRequest('/events/', 'GET', null, false);
        eventoSelect.innerHTML = '<option value="">Selecione o Evento</option>';
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.innerText = event.event_name;
            eventoSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Erro ao carregar eventos:", err);
    }
}

addBtn.onclick = () => {
    const div = document.createElement("div")
    div.className = "musica"
    div.innerHTML = `
        <input class="ordem" type="number" placeholder="Ordem da música (1-30)" required min="1" max="30">
        <input class="nomeh" type="text" placeholder="Nome da música" required>
        <input class="cantor" type="text" placeholder="Cantor" required>
        <input class="obs" type="text" placeholder="Observação (ex: tonalidade, versão...)">
        <input class="arquivo" type="file" accept=".mp3,.mp4">
        <input class="youtube" type="text" placeholder="Link YouTube">
    `
    musicasContainer.appendChild(div)
}

document.getElementById("form").addEventListener("submit", async e => {
    e.preventDefault()

    const loading = document.getElementById("loading")
    const status = document.getElementById("status")
    const eventId = eventoSelect.value

    if (!eventId) {
        alert("Selecione um evento.");
        return;
    }

    loading.classList.remove("hidden")
    status.innerText = ""

    try {
        const nomep = document.getElementById("nomep_play").value
        const blocos = document.querySelectorAll(".musica")

        if (blocos.length === 0) {
            alert("Adicione pelo menos uma música.");
            loading.classList.add("hidden");
            return;
        }

        for (const bloco of blocos) {
            const ordem = bloco.querySelector(".ordem").value
            const nomeh = bloco.querySelector(".nomeh").value
            const cantor = bloco.querySelector(".cantor").value
            const obsUser = bloco.querySelector(".obs").value
            const file = bloco.querySelector(".arquivo").files[0]
            const youtube = bloco.querySelector(".youtube").value

            if (!file && !youtube) {
                alert(`Música "${nomeh}": Envie um arquivo ou um link do YouTube.`)
                loading.classList.add("hidden")
                return
            }

            // 1. Create the music entry
            const formData = new FormData();
            formData.append('name', nomeh);
            formData.append('singer', cantor);
            formData.append('observation', `${nomep} - ${obsUser}`);
            if (youtube) formData.append('url', youtube);
            if (file) formData.append('file', file);

            const musicData = await apiRequest('/musics/', 'POST', formData, false);

            // 2. Create the link to the event (MusicOrder)
            await apiRequest('/music-order/', 'POST', {
                event: eventId,
                music: musicData.id,
                order: parseInt(ordem)
            }, false);
        }

        status.innerText = "Playbacks enviados com sucesso!"
        document.getElementById("form").reset()
        musicasContainer.innerHTML = ""

    } catch (err) {
        console.error(err)
        status.innerText = "Erro ao enviar: " + err.message
    }

    loading.classList.add("hidden")
})

loadEvents();
