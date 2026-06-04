import { useEffect, useState } from 'react'
import './App.css'
import './components/Dashboard/Dashboard.css'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Dashboard from './components/Dashboard/Dashboard'
import PublicRequest from './components/PublicRequest/PublicRequest'
import type { Screen } from './types/screen'
import { getAccessToken, getRefreshToken } from './services/api'

export type { Screen }

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    return (accessToken || refreshToken) ? 'dashboard' : 'login'
  })

  useEffect(() => {
    // Escuta evento de logout automático (token expirado e refresh falhou)
    function handleAutoLogout() {
      setScreen('login')
    }

    window.addEventListener('sonora:logout', handleAutoLogout)
    return () => window.removeEventListener('sonora:logout', handleAutoLogout)
  }, [])

  const isAuthScreen = screen === 'login' || screen === 'register' || screen === 'public-request'

  return (
    <div className={`App ${isAuthScreen ? 'auth-shell' : ''}`}>
      <Toaster position="top-center" />

      {screen === 'login' && <Login setScreen={setScreen} />}
      {screen === 'register' && <Register setScreen={setScreen} />}
      {screen === 'dashboard' && <Dashboard setScreen={setScreen} />}
      {screen === 'public-request' && <PublicRequest setScreen={setScreen} />}
    </div>
  )
}
