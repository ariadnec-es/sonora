export type UserRole = 'admin' | 'gerente' | 'cliente'

export interface StoredUser {
  email: string
  password: string
  role: UserRole
  displayName?: string
  projects: string[]
}

export const PROJECT_OPTIONS = ['Cerimônia de Abertura', 'Recepção dos convidados', 'Espaço de dança']

export const DEFAULT_ADMIN_USER: StoredUser = {
  email: 'admin@admin',
  password: 'admin',
  role: 'admin',
  displayName: 'Administrador Geral',
  projects: [...PROJECT_OPTIONS],
}

export function loadUsers(): StoredUser[] {
  if (typeof window === 'undefined') {
    return [DEFAULT_ADMIN_USER]
  }

  try {
    const raw = window.localStorage.getItem('users')

    if (!raw) {
      window.localStorage.setItem('users', JSON.stringify([DEFAULT_ADMIN_USER]))
      return [DEFAULT_ADMIN_USER]
    }

    const parsed = JSON.parse(raw) as StoredUser[]
    const alreadyHasAdmin = parsed.some((user) => user.email === DEFAULT_ADMIN_USER.email)

    if (!alreadyHasAdmin) {
      const nextUsers = [...parsed, DEFAULT_ADMIN_USER]
      window.localStorage.setItem('users', JSON.stringify(nextUsers))
      return nextUsers
    }

    return parsed
  } catch (error) {
    console.error('Falha ao carregar usuários', error)
    return [DEFAULT_ADMIN_USER]
  }
}

export function saveUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('users', JSON.stringify(users))
}

export function findUser(email: string, password: string): StoredUser | undefined {
  return loadUsers().find((user) => user.email === email && user.password === password)
}

export function persistLoggedUser(user: StoredUser) {
  if (typeof window === 'undefined') return

  const loggedUser = {
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    role: user.role,
    projects: user.projects,
  }

  window.localStorage.setItem('loggedUser', JSON.stringify(loggedUser))
  window.localStorage.setItem('userEmail', user.email)
}
