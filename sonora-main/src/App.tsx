import { useEffect, useState } from 'react'
import './App.css'
import './components/Dashboard/Dashboard.css'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Dashboard from './components/Dashboard/Dashboard'
import type { Screen } from './types/screen'

export type { Screen }

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')

  useEffect(() => {
    const loggedUser = localStorage.getItem('loggedUser')

    if (loggedUser) {
      setScreen('dashboard')
    }
  }, [])

  const isAuthScreen = screen === 'login' || screen === 'register'

  return (
    <div className={`App ${isAuthScreen ? 'auth-shell' : ''}`}>
      <Toaster position="top-center" />

      {screen === 'login' && <Login setScreen={setScreen} />}
      {screen === 'register' && <Register setScreen={setScreen} />}
      {screen === 'dashboard' && <Dashboard setScreen={setScreen} />}
    </div>
  )
}
