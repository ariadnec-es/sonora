import { FaUser, FaLock } from 'react-icons/fa'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Screen } from '../../types/screen'
import { register } from '../../services/authApi'
import './Register.css'

type Props = {
  setScreen: React.Dispatch<React.SetStateAction<Screen>>
}

export default function Register({ setScreen }: Props) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await register({ username, email, password })
      toast.success('Cadastro realizado! Faça login para continuar.')
      setScreen('login')
    } catch (err: unknown) {
      const error = err as { status?: number; body?: Record<string, string[]> }
      if (error?.body) {
        const messages = Object.values(error.body).flat().join(' ')
        toast.error(messages || 'Erro ao cadastrar.')
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
        <h1>Criar Conta</h1>

        <div className="input-field">
          <input
            type="text"
            placeholder="Nome de usuário"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <FaUser className="icon" />
        </div>

        <div className="input-field">
          <input
            type="email"
            placeholder="E-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <div className="input-field">
          <input
            type="password"
            placeholder="Confirmar senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <FaLock className="icon" />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <div className="signup-link">
          <a
            href="#"
            onClick={() => setScreen('login')}
          >
            Já tenho conta
          </a>
        </div>
      </form>
    </div>
  )
}
