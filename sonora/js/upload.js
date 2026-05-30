const supabaseUrl = "https://kxwhupsikhxngqincyek.supabase.co"
const supabaseKey = "sb_publishable_PJepmljkI2RLjWIj9_rsug_BmWn3QSv"

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
)

const addBtn = document.getElementById("add")
const musicas = document.getElementById("musicas")

addBtn.onclick = () => {

    const div = document.createElement("div")

    div.className = "musica"

    div.innerHTML = `
<input class="ordem" type="number" placeholder="Ordem da música" required>

<input class="nomeh" type="text" placeholder="Nome da música" required>

<input class="cantor" type="text" placeholder="Cantor" required>

<input class="obs" type="text" placeholder="Observação (ex: tonalidade, versão...)">

<input class="arquivo" type="file" accept=".mp3,.mp4">

<input class="youtube" type="text" placeholder="Link YouTube">
`

    musicas.appendChild(div)

}

document.getElementById("form").addEventListener("submit", async e => {

    e.preventDefault()

    const loading = document.getElementById("loading")
    const status = document.getElementById("status")

    loading.classList.remove("hidden")
    status.innerText = ""

    try {

        const nomep = document.getElementById("nomep_play").value
        const evento = document.getElementById("evento_play").value

        const blocos = document.querySelectorAll(".musica")

        for (const bloco of blocos) {

            const ordem = bloco.querySelector(".ordem").value
            const nomeh = bloco.querySelector(".nomeh").value
            const cantor = bloco.querySelector(".cantor").value
            const obsUser = bloco.querySelector(".obs").value
            const file = bloco.querySelector(".arquivo").files[0]
            const youtube = bloco.querySelector(".youtube").value

            let urlArquivo = null

            if (!file && !youtube) {
                alert("Envie um arquivo ou um link do YouTube.")
                loading.classList.add("hidden")
                return
            }

            if (file) {

                if (file.size > 10 * 1024 * 1024) {
                    alert("Arquivo maior que 10MB")
                    loading.classList.add("hidden")
                    return
                }

                const nomeArquivo = Date.now() + "_" + file.name
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9._-]/g, "_")

                const { error: uploadError } = await supabaseClient
                    .storage
                    .from("playbacks")
                    .upload(nomeArquivo, file)

                if (uploadError) {
                    console.error(uploadError)
                    alert("Erro no upload do arquivo.")
                    loading.classList.add("hidden")
                    return
                }

                const { data } = supabaseClient
                    .storage
                    .from("playbacks")
                    .getPublicUrl(nomeArquivo)

                urlArquivo = data.publicUrl
            }

            const { error: insertError } = await supabaseClient
                .from("playbacks")
                .insert([{
                    nomep_play: nomep,
                    nomeh_play: nomeh,
                    evento_play: evento,

                    ordem_play: ordem,
                    cantor_play: cantor,
                    obs_play: obsUser,

                    arquivo_url_play: urlArquivo,
                    youtube_url_play: youtube
                }])

            if (insertError) {
                console.error(insertError)
                alert("Erro ao salvar no banco.")
                loading.classList.add("hidden")
                return
            }

        }

        status.innerText = "Playbacks enviados com sucesso!"

        document.getElementById("form").reset()
        musicas.innerHTML = ""

    } catch (err) {

        console.error(err)
        status.innerText = "Erro inesperado."

    }

    loading.classList.add("hidden")

})

