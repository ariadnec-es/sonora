import { FaUser, FaLock } from 'react-icons/fa'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Screen } from '../../types/screen'
import { findUser, persistLoggedUser } from '../../services/auth'
import './Login.css'

type Props = {
  setScreen: React.Dispatch<React.SetStateAction<Screen>>
}

export default function Login({ setScreen }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const user = findUser(email, password)

    if (!user) {
      toast.error('Email ou senha inválidos')
      return
    }

    persistLoggedUser(user)

    toast.success('Login realizado!')

    setScreen('dashboard')
  }

  return (
    <div className="contanier">
      <form onSubmit={handleSubmit}>

        <h1>SONORA</h1>

        <div className="input-field">
          <input
            type="email"
            placeholder="E-mail"
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <FaUser className="icon" />
        </div>

        <div className="input-field">
          <input
            type="password"
            placeholder="Senha"
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <FaLock className="icon" />
        </div>

        <button>
          Entrar
        </button>

        <div className="signup-link">
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
