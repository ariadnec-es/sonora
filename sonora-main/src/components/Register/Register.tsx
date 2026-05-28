import { FaUser, FaLock } from 'react-icons/fa'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Screen } from '../../types/screen'
import { loadUsers, saveUsers } from '../../services/auth'
import './Register.css'

type Props = {
  setScreen: React.Dispatch<React.SetStateAction<Screen>>
}

export default function Register({ setScreen }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    const users = loadUsers()

    const userExists = users.find((user) => user.email === email)

    if (userExists) {
      toast.error('Email já cadastrado')
      return
    }

    const newUser = {
      email,
      password,
      role: 'cliente' as const,
      displayName: email.split('@')[0],
      projects: [],
    }

    const updatedUsers = [...users, newUser]

    saveUsers(updatedUsers)

    toast.success('Cadastro realizado!')

    setScreen('login')
  }

  return (
    <div className="contanier">
      <form onSubmit={handleSubmit}>
        <h1>Criar Conta</h1>

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

        <div className="input-field">
          <input
            type="password"
            placeholder="Confirmar senha"
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <FaLock className="icon" />
        </div>

        <button type="submit">
          Cadastrar
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
