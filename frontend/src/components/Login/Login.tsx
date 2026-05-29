import { FaUser, FaLock } from 'react-icons/fa'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Screen } from '../../types/screen'
import { login } from '../../services/authApi'
import './Login.css'

type Props = {
  setScreen: React.Dispatch<React.SetStateAction<Screen>>
}

export default function Login({ setScreen }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error('Preencha usuário e senha.')
      return
    }

    setLoading(true)
    try {
      await login({ username, password })
      toast.success('Login realizado!')
      setScreen('dashboard')
    } catch (err: unknown) {
      const error = err as { status?: number; body?: { detail?: string } }
      if (error?.status === 401) {
        toast.error('Usuário ou senha inválidos.')
      } else {
        toast.error('Erro ao conectar com o servidor.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contanier">
      <form onSubmit={handleSubmit}>

        <h1>SONORA</h1>

        <div className="input-field">
          <input
            type="text"
            placeholder="Usuário ou e-mail"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <FaUser className="icon" />
        </div>

        <div className="input-field">
          <input
            type="password"
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <FaLock className="icon" />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="signup-link">
          <a
            href="#"
            onClick={() => setScreen('public-request')}
            style={{ display: 'block', marginBottom: '10px' }}
          >
            Solicitar música para um evento
          </a>
          <a
            href="#"
            onClick={() => setScreen('register')}
          >
            Criar nova conta
          </a>
        </div>

      </form>
    </div>
  )
}
