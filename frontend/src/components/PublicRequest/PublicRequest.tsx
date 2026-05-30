import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FaMusic, FaUser, FaLink, FaPlus, FaTrash } from 'react-icons/fa'
import type { Screen } from '../../types/screen'
import { fetchEvents } from '../../services/eventsApi'
import { createMusic } from '../../services/musicsApi'
import { createMusicOrder } from '../../services/musicOrdersApi'
import type { ApiEvent } from '../../types/api'
import './PublicRequest.css'

interface PublicRequestProps {
  setScreen: React.Dispatch<React.SetStateAction<Screen>>
}

interface MusicRequest {
  order: number
  singer: string
  name: string
  url: string
  observation: string
}

export default function PublicRequest({ setScreen }: PublicRequestProps) {
  const [userName, setUserName] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [musics, setMusics] = useState<MusicRequest[]>([
    { order: 1, singer: '', name: '', url: '', observation: '' }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents()
        setEvents(data)
      } catch {
        toast.error('Erro ao carregar eventos.')
      }
    }
    loadEvents()
  }, [])

  function addMusic() {
    const nextOrder = musics.length > 0 ? Math.max(...musics.map(m => m.order)) + 1 : 1
    setMusics([...musics, { order: nextOrder, singer: '', name: '', url: '', observation: '' }])
  }

  function removeMusic(index: number) {
    if (musics.length === 1) return
    setMusics(musics.filter((_, i) => i !== index))
  }

  function updateMusic(index: number, field: keyof MusicRequest, value: string | number) {
    const updated = [...musics]
    updated[index] = { ...updated[index], [field]: value }
    setMusics(updated)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!userName.trim() || !selectedEventId) {
      toast.error('Preencha seu nome e selecione um evento.')
      return
    }

    const orders = musics.map(m => m.order)
    if (new Set(orders).size !== orders.length) {
      toast.error('Não é permitido repetir a ordem das músicas.')
      return
    }

    setLoading(true)
    try {
      for (const m of musics) {
        // 1. Cria a música no banco (como usuário anônimo)
        const apiMusic = await createMusic({
          name: m.name,
          url: m.url,
          singer: m.singer,
          observation: `${m.observation} (Solicitado por: ${userName})`.trim()
        })

        // 2. Vincula ao evento via MusicOrder
        await createMusicOrder({
          music: apiMusic.id,
          event: selectedEventId,
          order: m.order,
          status: 'pending',
          category: 'interactive'
        })
      }

      toast.success('Solicitação enviada com sucesso!')
      setScreen('login')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="public-request-container">
      <form onSubmit={handleSubmit}>
        <h1>Solicitar Músicas</h1>
        <p className="subtitle">Envie sugestões de músicas para o evento</p>

        <div className="input-field">
          <input
            type="text"
            placeholder="Seu nome"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <FaUser className="icon" />
        </div>

        <div className="input-field">
          <select
            required
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="select-input"
          >
            <option value="">Selecione o evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.event_name}</option>
            ))}
          </select>
        </div>

        <div className="musics-section">
          <h3>Músicas</h3>
          {musics.map((m, index) => (
            <div key={index} className="music-item-form">
              <div className="music-item-header">
                <span>Música #{index + 1}</span>
                {musics.length > 1 && (
                  <button type="button" onClick={() => removeMusic(index)} className="btn-remove">
                    <FaTrash />
                  </button>
                )}
              </div>

              <div className="grid-2">
                <div className="input-field compact">
                  <input
                    type="number"
                    placeholder="Ordem"
                    required
                    min="1"
                    value={m.order}
                    onChange={(e) => updateMusic(index, 'order', Number(e.target.value))}
                  />
                </div>
                <div className="input-field compact">
                  <input
                    type="text"
                    placeholder="Cantor"
                    required
                    value={m.singer}
                    onChange={(e) => updateMusic(index, 'singer', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-field compact">
                <input
                  type="text"
                  placeholder="Nome da música"
                  required
                  value={m.name}
                  onChange={(e) => updateMusic(index, 'name', e.target.value)}
                />
                <FaMusic className="icon" />
              </div>

              <div className="input-field compact">
                <input
                  type="url"
                  placeholder="Link do YouTube"
                  required
                  value={m.url}
                  onChange={(e) => updateMusic(index, 'url', e.target.value)}
                />
                <FaLink className="icon" />
              </div>

              <div className="input-field compact">
                <textarea
                  placeholder="Observação"
                  value={m.observation}
                  onChange={(e) => updateMusic(index, 'observation', e.target.value)}
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addMusic} className="btn-add">
            <FaPlus /> Adicionar mais uma música
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </button>

        <div className="signup-link">
          <a href="#" onClick={() => setScreen('login')}>Voltar para o Login</a>
        </div>
      </form>
    </div>
  )
}
